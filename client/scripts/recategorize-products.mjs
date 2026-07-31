/**
 * Moves the products already in the database onto the current collections.
 *
 *   node scripts/recategorize-products.mjs          # show what would change
 *   node scripts/recategorize-products.mjs --apply  # write it
 *
 * The catalog (hhc-catalog.json) is the reference: anything seeded from it is
 * matched by name and gets that product's category. Anything added by hand in
 * the admin panel falls back to a keyword classifier, and whatever the
 * classifier cannot place is listed at the end so it can be fixed by hand.
 */
import { readFileSync } from "node:fs";
import { classify } from "../lib/classify-product.mjs";
import { prisma } from "./lib/db.mjs";

const apply = process.argv.includes("--apply");

const catalog = JSON.parse(
  readFileSync(new URL("./hhc-catalog.json", import.meta.url), "utf8")
);

const catalogByName = new Map(
  catalog.map((product) => [product.name.trim(), product.category])
);

const all = await prisma.product.findMany();

let fromCatalog = 0;
let fromRules = 0;
let unchanged = 0;
const updates = [];
const unmatched = [];

for (const product of all) {
  const name = String(product.name ?? "").trim();
  const target = catalogByName.get(name) ?? classify(name);

  if (!target) {
    unmatched.push(product);
    continue;
  }

  if (catalogByName.has(name)) {
    fromCatalog++;
  } else {
    fromRules++;
  }

  if (product.category === target) {
    unchanged++;
    continue;
  }

  updates.push({ id: product.id, name, from: product.category, to: target });
}

console.log(`${all.length} product(s) in the database`);
console.log(`  ${fromCatalog} matched the catalog by name`);
console.log(`  ${fromRules} classified by keyword`);
console.log(`  ${unchanged} already in the right collection`);
console.log(`  ${updates.length} to move`);

const moves = {};
for (const update of updates) {
  const key = `${update.from} → ${update.to}`;
  moves[key] = (moves[key] || 0) + 1;
}

for (const [move, n] of Object.entries(moves).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(3)}  ${move}`);
}

if (unmatched.length) {
  console.log(`\n${unmatched.length} product(s) could not be classified:`);
  for (const product of unmatched) {
    console.log(`  [${product.category}] ${product.name}`);
  }
}

if (!apply) {
  console.log("\nDry run. Re-run with --apply to write these changes.");
} else if (updates.length) {
  const result = await prisma.$transaction(
    updates.map((update) =>
      prisma.product.update({
        where: { id: update.id },
        data: { category: update.to },
      })
    )
  );

  console.log(`\nUpdated ${result.length} product(s).`);
} else {
  console.log("\nNothing to do.");
}

await prisma.$disconnect();
