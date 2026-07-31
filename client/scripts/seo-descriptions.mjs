/**
 * Writes a search-ready description onto every product.
 *
 *   node scripts/seo-descriptions.mjs           # show what would change
 *   node scripts/seo-descriptions.mjs --apply   # write the catalog and the database
 *   node scripts/seo-descriptions.mjs --force   # also rewrite hand-edited copy
 *
 * A third of the HHC catalog arrives clipped mid-word, because the supplier
 * caps the field: "...enhancing the look of your vanity, coffee table, bedside,
 * o". Left alone, that fragment is what Google prints under the shop's link.
 * This keeps the whole sentences and drops the cut one — see lib/product-copy.mjs,
 * which the site renders from too, so a stored description and a generated one
 * always read the same.
 *
 * The price and the Cash on Delivery line are deliberately NOT stored. Those
 * are added when the page renders, so repricing the catalog can never leave a
 * stale figure sitting in a search result.
 *
 * Copy edited by hand in the admin panel is left alone unless --force is given.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { productProse } from "../lib/product-copy.mjs";
import { prisma } from "./lib/db.mjs";

const apply = process.argv.includes("--apply");
const force = process.argv.includes("--force");

const catalogPath = new URL("./hhc-catalog.json", import.meta.url);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

const written = catalog.map((product) => ({
  ...product,
  seoDescription: product.seoDescription && !force
    ? product.seoDescription
    : productProse(product),
}));

// How much of the catalog this actually rescues, which is the reason to run it.
const clipped = catalog.filter(
  (product) => !/[.!?]\s*$/.test((product.description ?? "").trim())
);

const thin = written.filter(
  (product) => product.seoDescription.length < 40
);

console.log(`${written.length} product(s)`);
console.log(
  `${clipped.length} had a description the supplier cut off mid-sentence\n`
);

for (const product of written.slice(0, 5)) {
  console.log(`  ${product.name.slice(0, 60)}`);
  console.log(`    ${product.seoDescription}\n`);
}

if (thin.length > 0) {
  console.log(
    `${thin.length} product(s) had no complete sentence to keep and fell back to`
  );
  console.log("their name — worth writing by hand in the admin panel:\n");

  for (const product of thin.slice(0, 5)) {
    console.log(`  ${product.seoDescription}`);
  }

  if (thin.length > 5) console.log(`  ...and ${thin.length - 5} more`);
  console.log("");
}

if (!apply) {
  console.log("Dry run. Re-run with --apply to write the catalog and the database.");
  process.exit(0);
}

// Keep the field order the file already had, with seoDescription beside the
// description it was built from and hhcId last.
writeFileSync(
  catalogPath,
  JSON.stringify(
    written.map(({ name, price, costPrice, description, seoDescription, hhcId, ...rest }) => ({
      name,
      price,
      costPrice,
      description,
      seoDescription,
      ...rest,
      hhcId,
    })),
    null,
    1
  ) + "\n",
  "utf8"
);

console.log("Catalog updated.");

// Anything added by hand in the admin panel is not in the catalog file, so it
// gets a description built from its own row rather than being skipped.
const rows = await prisma.product.findMany();
const byName = new Map(written.map((product) => [product.name, product]));

const toUpdate = rows.filter((row) => force || !row.seoDescription);

if (toUpdate.length === 0) {
  console.log("Database: every product already has one. Use --force to rewrite.");
} else {
  const result = await prisma.$transaction(
    toUpdate.map((row) =>
      prisma.product.update({
        where: { id: row.id },
        data: {
          seoDescription:
            byName.get(row.name)?.seoDescription ?? productProse(row),
        },
      })
    )
  );

  console.log(`Database: ${result.length} product(s) updated.`);
}

await prisma.$disconnect();
