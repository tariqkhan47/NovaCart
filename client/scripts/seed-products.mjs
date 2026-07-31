/**
 * Loads the store catalog into the database.
 *
 *   node scripts/seed-products.mjs
 *
 * The products come from the HHC dropshipping catalog and live in
 * hhc-catalog.json. Safe to re-run: it skips any product whose name is
 * already there.
 */
import { readFileSync } from "node:fs";
import { prisma } from "./lib/db.mjs";

const seed = JSON.parse(
  readFileSync(new URL("./hhc-catalog.json", import.meta.url), "utf8")
);

let added = 0;
let skipped = 0;

for (const product of seed) {
  const exists = await prisma.product.findFirst({
    where: { name: product.name },
  });

  if (exists) {
    skipped++;
    continue;
  }

  // hhcId and costPrice are kept in the JSON — one so prices can be re-synced
  // later, the other so the markup is never applied twice. Neither belongs in
  // the database: the products API is public, and the wholesale price is
  // nobody's business but the shop's.
  const { hhcId, costPrice, ...fields } = product;

  await prisma.product.create({ data: fields });

  added++;
}

console.log(`Done. ${added} product(s) added, ${skipped} already there.`);

const counts = await prisma.product.groupBy({
  by: ["category"],
  _count: true,
  orderBy: { category: "asc" },
});

for (const row of counts) {
  console.log(`  ${String(row._count).padStart(3)}  ${row.category}`);
}

await prisma.$disconnect();
