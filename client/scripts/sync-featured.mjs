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

const apply = process.argv.includes("--apply");

const catalog = JSON.parse(
  readFileSync(new URL("./hhc-catalog.json", import.meta.url), "utf8")
);

const featuredNames = new Set(
  catalog.filter((product) => product.featured).map((product) => product.name.trim())
);

await mongoose.connect(process.env.MONGODB_URI);

const products = mongoose.connection.db.collection("products");
const all = await products.find({}).toArray();

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
  const result = await products.bulkWrite([
    ...toFeature.map((product) => ({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: { featured: true, updatedAt: new Date() } },
      },
    })),
    ...toUnfeature.map((product) => ({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: { featured: false, updatedAt: new Date() } },
      },
    })),
  ]);

  console.log(`\nUpdated ${result.modifiedCount} product(s).`);
} else {
  console.log("\nNothing to do.");
}

await mongoose.disconnect();
