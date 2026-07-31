/**
 * Syncs the Featured Products picks from the catalog into the database.
 *
 *   node scripts/sync-featured.mjs          # show what would change
 *   node scripts/sync-featured.mjs --apply  # write it
 *
 * hhc-catalog.json marks one standout product per collection with
 * "featured": true. This copies those flags onto the matching rows and clears
 * the flag everywhere else, so the home page row stays one product per
 * collection. Day to day the admin panel's Featured checkbox is the easier
 * way to change a pick — re-running this script resets it back to the catalog.
 */
import { readFileSync } from "node:fs";
import { prisma } from "./lib/db.mjs";

const apply = process.argv.includes("--apply");

const catalog = JSON.parse(
  readFileSync(new URL("./hhc-catalog.json", import.meta.url), "utf8")
);

const featuredNames = new Set(
  catalog.filter((product) => product.featured).map((product) => product.name.trim())
);

const all = await prisma.product.findMany();

const toFeature = [];
const toUnfeature = [];

for (const product of all) {
  const shouldFeature = featuredNames.has(String(product.name ?? "").trim());

  if (shouldFeature && product.featured !== true) toFeature.push(product);
  if (!shouldFeature && product.featured === true) toUnfeature.push(product);
}

console.log(`${all.length} product(s) in the database`);
console.log(`  ${featuredNames.size} featured in the catalog`);
console.log(`  ${toFeature.length} to feature, ${toUnfeature.length} to unfeature`);

for (const product of toFeature) {
  console.log(`  + [${product.category}] ${product.name}`);
}

for (const product of toUnfeature) {
  console.log(`  - [${product.category}] ${product.name}`);
}

const notFound = [...featuredNames].filter(
  (name) => !all.some((product) => String(product.name ?? "").trim() === name)
);

if (notFound.length) {
  console.log(`\n${notFound.length} featured pick(s) not in the database:`);
  for (const name of notFound) console.log(`  ${name}`);
}

if (!apply) {
  console.log("\nDry run. Re-run with --apply to write these changes.");
} else if (toFeature.length || toUnfeature.length) {
  const result = await prisma.$transaction([
    ...toFeature.map((product) =>
      prisma.product.update({ where: { id: product.id }, data: { featured: true } })
    ),
    ...toUnfeature.map((product) =>
      prisma.product.update({ where: { id: product.id }, data: { featured: false } })
    ),
  ]);

  console.log(`\nUpdated ${result.length} product(s).`);
} else {
  console.log("\nNothing to do.");
}

await prisma.$disconnect();
