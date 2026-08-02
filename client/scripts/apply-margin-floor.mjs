/**
 * Raises every thin product to a floor of Rs 350 kept per sale.
 *
 *   node scripts/apply-margin-floor.mjs           # report only
 *   node scripts/apply-margin-floor.mjs --apply   # write
 *   node scripts/apply-margin-floor.mjs --rollback price-backup.json
 *
 * The catalog was built on a percentage markup, which is what left half the
 * shop keeping under Rs 200 a sale: 40% of a small cost is a small number, and
 * a small number cannot pay for the advertising click that produced the sale.
 * A floor in rupees is the thing that actually has to hold, so that is what
 * this sets. Products already above the floor are not touched — this only
 * lifts, it never lowers a price.
 *
 * Writes price-backup.json before the first update. Nothing else records what
 * a product used to cost, so without that file the change is one-way.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { prisma } from "./lib/db.mjs";

const MARGIN_FLOOR = 350;

const catalogUrl = new URL("./hhc-catalog.json", import.meta.url);
const backupUrl = new URL("./price-backup.json", import.meta.url);

const apply = process.argv.includes("--apply");
const rollbackIndex = process.argv.indexOf("--rollback");

// Prisma stores `name` as VARCHAR(191), so the database's copy of a long
// supplier name is truncated while the catalog keeps it whole. Matching on the
// truncated form is the only join that holds for every row.
const key = (name) => String(name ?? "").slice(0, 191).trim().toLowerCase();

/**
 * Every price in this shop ends in 9, and a shopper reads that shape as a
 * price rather than as a number someone worked out. Rounding goes up only:
 * down would land under the floor this exists to enforce.
 */
function toPricePoint(target) {
  return Math.ceil((target + 1) / 10) * 10 - 1;
}

async function rollback(file) {
  const saved = JSON.parse(readFileSync(file, "utf8"));
  console.log(`Restoring ${saved.length} prices from ${file}`);

  // One row at a time. A $transaction over hundreds of rows on a remote
  // database exceeds Prisma's five second interactive limit and rolls the
  // whole thing back; each of these writes stands on its own and is
  // idempotent, so there is nothing a partial run leaves broken.
  for (const row of saved) {
    await prisma.product.update({
      where: { id: row.id },
      data: { price: row.price, compareAtPrice: row.compareAtPrice },
    });
  }

  console.log("Done. Catalog file is not restored — check git for that.");
}

async function main() {
  if (rollbackIndex !== -1) {
    await rollback(process.argv[rollbackIndex + 1]);
    return;
  }

  const catalog = JSON.parse(readFileSync(catalogUrl, "utf8"));

  const costByName = new Map(
    catalog
      .filter((p) => typeof p.costPrice === "number")
      .map((p) => [key(p.name), p.costPrice])
  );

  const rows = await prisma.product.findMany({
    select: { id: true, name: true, price: true, compareAtPrice: true },
  });

  // price and compareAtPrice are Decimal columns, and Prisma hands back a
  // Decimal object whose `+` concatenates rather than adds — 1200 + 60 came
  // out as 120060 and put eleven nonsense crossed-out prices on the shop.
  // Subtraction and comparison happen to coerce correctly, which is what made
  // it look fine right up until something added. Convert once, here.
  const products = rows.map((p) => ({
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice === null ? null : Number(p.compareAtPrice),
  }));

  const changes = [];
  let noCost = 0;
  let alreadyFine = 0;

  for (const p of products) {
    const cost = costByName.get(key(p.name));

    if (cost === undefined) {
      noCost++;
      continue;
    }

    if (p.price - cost >= MARGIN_FLOOR) {
      alreadyFine++;
      continue;
    }

    const price = toPricePoint(cost + MARGIN_FLOOR);

    // A struck-through price that is not above the asking price reads as a
    // mistake. One that is still above it is simply a smaller discount than it
    // was, which is honest and needs no help — so a deal is only moved when
    // the new price has caught up with it.
    const compareAtPrice =
      p.compareAtPrice !== null && p.compareAtPrice <= price
        ? p.compareAtPrice + (price - p.price)
        : p.compareAtPrice;

    changes.push({
      id: p.id,
      name: p.name,
      cost,
      was: p.price,
      wasCompare: p.compareAtPrice,
      price,
      compareAtPrice,
    });
  }

  console.log(`${products.length} products`);
  console.log(`  ${noCost} with no known supplier cost — left alone`);
  console.log(`  ${alreadyFine} already keeping Rs ${MARGIN_FLOOR}+ — left alone`);
  console.log(`  ${changes.length} to reprice`);

  if (!apply) {
    console.log("\nReport only. Re-run with --apply to write.");
    return;
  }

  // Before the first write, not after: the old prices exist nowhere else.
  writeFileSync(
    backupUrl,
    JSON.stringify(
      // What the row held before, carried straight through rather than
      // reconstructed by undoing the arithmetic — reversing a calculation is
      // how the crossed-out prices got mangled in the first place.
      changes.map((c) => ({
        id: c.id,
        name: c.name,
        price: c.was,
        compareAtPrice: c.wasCompare,
      })),
      null,
      1
    )
  );
  console.log(`\nOld prices saved to scripts/price-backup.json`);

  let done = 0;

  for (const c of changes) {
    await prisma.product.update({
      where: { id: c.id },
      data: { price: c.price, compareAtPrice: c.compareAtPrice },
    });

    if (++done % 50 === 0) console.log(`  ${done}/${changes.length}`);
  }

  console.log(`  ${done}/${changes.length}`);

  // The catalog is the source the seed script reseeds from, so leaving it on
  // the old prices would quietly undo this the next time it runs.
  const byName = new Map(changes.map((c) => [key(c.name), c.price]));
  let catalogUpdated = 0;

  for (const entry of catalog) {
    const price = byName.get(key(entry.name));
    if (price !== undefined && entry.price !== price) {
      entry.price = price;
      catalogUpdated++;
    }
  }

  writeFileSync(catalogUrl, JSON.stringify(catalog, null, 2));
  console.log(`Catalog file updated for ${catalogUpdated} entries`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
