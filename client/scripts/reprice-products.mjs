/**
 * Puts the shop's markup on top of the supplier's wholesale price.
 *
 *   node scripts/reprice-products.mjs          # show what would change
 *   node scripts/reprice-products.mjs --apply  # write the catalog and the database
 *
 * The catalog was seeded at HHC's raw wholesale price, so the shop was selling
 * at cost. Each product keeps that figure as costPrice and price becomes what
 * the customer pays, worked out from the tiers below. Cheaper items carry a
 * bigger percentage because a flat markup leaves almost nothing on a Rs 69
 * product.
 *
 * Re-running is safe: the retail price is always computed from costPrice, so
 * the markup is never applied twice. After a supplier re-sync, update costPrice
 * in the catalog and run this again.
 */
import mongoose from "mongoose";
import { readFileSync, writeFileSync } from "node:fs";

// First tier whose ceiling the cost price does not exceed wins.
const TIERS = [
  { upTo: 100, markup: 0.6 },
  { upTo: 999, markup: 0.5 },
  { upTo: 2999, markup: 0.4 },
  { upTo: Infinity, markup: 0.3 },
];

export function markupFor(cost) {
  return TIERS.find((tier) => cost <= tier.upTo).markup;
}

/**
 * Marked-up price, rounded to the nearest ten and dropped by one so every
 * price ends in a 9 — Rs 1,169 rather than Rs 1,168.50.
 */
export function retailPrice(cost) {
  const marked = cost * (1 + markupFor(cost));
  return Math.max(Math.round(marked / 10) * 10 - 1, 9);
}

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Fall through to the ambient environment.
  }
}

const apply = process.argv.includes("--apply");

const catalogPath = new URL("./hhc-catalog.json", import.meta.url);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

// The first run has no costPrice yet — the seeded price is the wholesale one.
const priced = catalog.map((product) => {
  const cost = product.costPrice ?? product.price;

  return {
    ...product,
    costPrice: cost,
    price: retailPrice(cost),
  };
});

const byTier = new Map(TIERS.map((tier) => [tier.markup, []]));

for (const product of priced) {
  byTier.get(markupFor(product.costPrice)).push(product);
}

console.log(`${priced.length} product(s)\n`);

for (const tier of TIERS) {
  const rows = byTier.get(tier.markup);
  if (rows.length === 0) continue;

  const ceiling = tier.upTo === Infinity ? "and up" : `and under`;

  console.log(
    `  +${tier.markup * 100}%  Rs ${tier.upTo === Infinity ? 3000 : tier.upTo} ${ceiling}  — ${rows.length} product(s)`
  );

  for (const product of rows.slice(0, 3)) {
    console.log(
      `         Rs ${String(product.costPrice).padStart(5)} → Rs ${String(
        product.price
      ).padStart(5)}   ${product.name.slice(0, 44)}`
    );
  }

  if (rows.length > 3) console.log(`         ...and ${rows.length - 3} more`);
  console.log("");
}

const costTotal = priced.reduce((sum, p) => sum + p.costPrice, 0);
const retailTotal = priced.reduce((sum, p) => sum + p.price, 0);

console.log(
  `Catalog value: Rs ${costTotal.toLocaleString()} at cost → Rs ${retailTotal.toLocaleString()} at retail`
);
console.log(
  `Margin on a full sell-through: Rs ${(retailTotal - costTotal).toLocaleString()}`
);

if (!apply) {
  console.log("\nDry run. Re-run with --apply to write the catalog and the database.");
  process.exit(0);
}

// Keep the field order the file already had — name, price, then the rest with
// hhcId last — with costPrice tucked in beside the price it is derived from.
const written = priced.map(({ name, price, costPrice, hhcId, ...rest }) => ({
  name,
  price,
  costPrice,
  ...rest,
  hhcId,
}));

writeFileSync(catalogPath, JSON.stringify(written, null, 1) + "\n", "utf8");
console.log("\nCatalog updated.");

loadEnv();

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (expected in .env.local) — database not updated");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const products = mongoose.connection.db.collection("products");

// costPrice stays out of the database: the products API is public, and the
// wholesale price is nobody's business but the shop's.
const updates = priced.map((product) => ({
  updateOne: {
    filter: { name: product.name },
    update: { $set: { price: product.price, updatedAt: new Date() } },
  },
}));

const result = await products.bulkWrite(updates);

console.log(
  `Database: ${result.matchedCount} matched, ${result.modifiedCount} updated.`
);

const missing = priced.length - result.matchedCount;
if (missing > 0) {
  console.log(`${missing} catalog product(s) were not found in the database.`);
}

await mongoose.disconnect();
