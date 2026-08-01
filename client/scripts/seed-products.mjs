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

// Prisma maps a bare `String` to VARCHAR(191) on MySQL, so any name longer
// than this is silently cut on the way in. Thirteen of the supplier's names
// are — they run to 200-plus characters of keyword padding.
const STORED_NAME_LIMIT = 191;

/**
 * What two names have to agree on for them to be the same product.
 *
 * An exact `where: { name }` is not enough, and getting this wrong is not
 * cosmetic: on 2026-08-01 a run of this script put thirteen products on the
 * shop a second time, each with its own id and its own page. The catalog
 * holds the supplier's full name; the database holds it cut at 191
 * characters; the two never match, so every run added another copy.
 *
 * Truncating the same way MySQL does is what makes the comparison honest.
 * The entity and whitespace folding is belt and braces on top — the supplier
 * writes "Travel &amp; Home Storage" where a row may say "Travel & Home".
 *
 * Compared once up front rather than per row: 500 findFirst round trips to a
 * remote database was also most of this script's running time.
 */
const key = (name) =>
  String(name ?? "")
    .slice(0, STORED_NAME_LIMIT)
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const existing = new Set(
  (await prisma.product.findMany({ select: { name: true } })).map((row) => key(row.name))
);

for (const product of seed) {
  if (existing.has(key(product.name))) {
    skipped++;
    continue;
  }

  // Added as we go, so a catalog that lists the same product twice does not
  // seed it twice either.
  existing.add(key(product.name));

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
