/**
 * Loads the store catalog into the database.
 *
 *   node scripts/seed-products.mjs
 *
 * The products come from the HHC dropshipping catalog and live in
 * hhc-catalog.json. Safe to re-run: it skips any product whose name is
 * already there.
 */
import mongoose from "mongoose";
import { readFileSync } from "node:fs";

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

loadEnv();

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (expected in .env.local)");
  process.exit(1);
}

const seed = JSON.parse(
  readFileSync(new URL("./hhc-catalog.json", import.meta.url), "utf8")
);

await mongoose.connect(process.env.MONGODB_URI);

const products = mongoose.connection.db.collection("products");

let added = 0;
let skipped = 0;

for (const product of seed) {
  const exists = await products.findOne({ name: product.name });

  if (exists) {
    skipped++;
    continue;
  }

  // hhcId and costPrice are kept in the JSON — one so prices can be re-synced
  // later, the other so the markup is never applied twice. Neither belongs in
  // the database: the products API is public, and the wholesale price is
  // nobody's business but the shop's.
  const { hhcId, costPrice, ...fields } = product;

  await products.insertOne({
    ...fields,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  added++;
}

console.log(`Done. ${added} product(s) added, ${skipped} already there.`);

const counts = await products
  .aggregate([
    { $group: { _id: "$category", n: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ])
  .toArray();

for (const row of counts) {
  console.log(`  ${String(row.n).padStart(3)}  ${row._id}`);
}

await mongoose.disconnect();
