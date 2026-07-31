/**
 * Runs the current sanitizer back over every description already stored.
 *
 *   node scripts/resanitize-descriptions.mjs           # show what would change
 *   node scripts/resanitize-descriptions.mjs --apply   # write the catalog and the database
 *
 * lib/rich-text.mjs cleans a description on the way in, so copy imported before
 * a rule was added keeps whatever that rule now removes. The WordPress
 * shortcodes are the case this was written for: the supplier's markup carries
 * [video ...][/video], which is text rather than a tag, so tag stripping left
 * it to print on the product page as that literal string.
 *
 * Safe to run at any time — sanitizing already-clean HTML changes nothing.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { sanitizeHtml, htmlToText, stripShortcodes } from "../lib/rich-text.mjs";
import { prisma } from "./lib/db.mjs";

/**
 * Both description fields of a product, cleaned by the rules that apply to
 * each. A product with no long description gets no detailHtml key at all,
 * rather than one set to undefined — that reaches Mongo as a literal null and
 * would give every such product an empty write-up.
 */
function cleaned(product) {
  return {
    // Plain text, so only the shortcodes come out — the tag stripper would eat
    // anything a supplier wrote in angle brackets.
    description: stripShortcodes(product.description),
    ...(product.detailHtml
      ? { detailHtml: sanitizeHtml(product.detailHtml) }
      : {}),
  };
}

/** Whether either field would change. */
function dirty(product) {
  const clean = cleaned(product);

  return (
    clean.description !== product.description ||
    (product.detailHtml != null && clean.detailHtml !== product.detailHtml)
  );
}

const apply = process.argv.includes("--apply");

const catalogPath = new URL("./hhc-catalog.json", import.meta.url);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

const changed = catalog.filter(dirty);

console.log(`${catalog.length} product(s) in the catalog`);
console.log(`${changed.length} whose description the current rules would change\n`);

for (const product of changed.slice(0, 3)) {
  const before = htmlToText(`${product.description} ${product.detailHtml ?? ""}`);
  const clean = cleaned(product);
  const after = htmlToText(`${clean.description} ${clean.detailHtml ?? ""}`);

  console.log(`  ${product.name.slice(0, 55)}`);
  console.log(`    ${before.length} → ${after.length} characters of text`);

  // The removed run, so a rule that eats more than it should is visible here
  // rather than on the live site.
  const cut = before.length - after.length;
  if (cut > 0) {
    const at = [...before].findIndex((ch, i) => ch !== after[i]);
    console.log(`    removed: ${JSON.stringify(before.slice(at, at + 90))}\n`);
  }
}

if (changed.length === 0) {
  console.log("Nothing to clean.");
  process.exit(0);
}

if (!apply) {
  console.log("Dry run. Re-run with --apply to write the catalog and the database.");
  process.exit(0);
}

writeFileSync(
  catalogPath,
  JSON.stringify(
    catalog.map((product) => ({ ...product, ...cleaned(product) })),
    null,
    1
  ) + "\n",
  "utf8"
);

console.log("Catalog updated.");

// Driven off the database rather than the catalog, so descriptions written by
// hand in the admin panel are cleaned by the same rules.
const rows = await prisma.product.findMany({
  select: { id: true, description: true, detailHtml: true },
});

const dirtyRows = rows.filter(dirty);

if (dirtyRows.length === 0) {
  console.log("Database: every description is already clean.");
} else {
  const result = await prisma.$transaction(
    dirtyRows.map((row) =>
      prisma.product.update({
        where: { id: row.id },
        data: cleaned(row),
      })
    )
  );

  console.log(`Database: ${result.length} product(s) cleaned.`);
}

await prisma.$disconnect();
