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

const catalogByName = new Map(
  catalog.map((product) => [product.name.trim(), product.category])
);

// First rule that matches wins, so the specific patterns come before the
// broad ones ("smart watch" before "watch", "water bottle" before "bottle").
const rules = [
  [/smart\s*watch|smartwatch|fitness tracker|bluetooth call/i, "Smart Watches"],
  [/\bwatch(es)?\b|wrist ?watch|timepiece/i, "Watches"],
  [
    /perfume|parfum|fragrance|eau de|cologne|lip balm|lipstick|makeup|toothpaste|shampoo|soap|skin care|lotion/i,
    "Fragrances & Beauty",
  ],
  [
    /tumbler|water bottle|drinking bottle|thermos|travel mug|sipper|straw|flask|drinkware/i,
    "Drinkware",
  ],
  [
    /backpack|sling bag|handbag|shoulder bag|wallet|luggage|suitcase|passport|pouch|carry case|camping chair|folding stool/i,
    "Bags & Travel",
  ],
  [
    /earbud|earphone|headphone|airpods|power ?bank|phone holder|phone (mount|bracket)|charger|led light|flash ?light|head ?lamp|torch|camping (bulb|lamp)|emergency light|\bfan\b|speaker|usb/i,
    "Gadgets & Electronics",
  ],
  [
    /baby|infant|toddler|feeder|nappy|diaper|play mat|kids chair|pram|stroller/i,
    "Baby & Kids",
  ],
  [
    /workbook|tracing|alphabet|phonics|abc|stationery|pencil|\bpen\b|notebook|geometry|coloring book|colouring book|painting book|learning (toy|book|tablet)|puzzle board|educational/i,
    "Learning & Stationery",
  ],
  [
    /\btoy\b|toys|plush|doll|rc car|remote control|building block|board game|puzzle|bubble|fidget|keychain toy/i,
    "Toys & Games",
  ],
  [
    /bracelet|necklace|pendant|bangle|earring|ring\b|jewel|belt\b|\bbra\b|brassiere|keychain|charm|scarf|\bsuit\b/i,
    "Fashion & Jewelry",
  ],
  [
    /kitchen|cookware|sauce ?pan|chopper|slicer|grater|knife|ice cube|mixing bowl|blender|whisk|spice|measuring (cup|spoon)|sink|jar opener|food (processor|storage)/i,
    "Kitchen",
  ],
  [
    /decor|showpiece|wall art|photo tile|candle|vase|ornament|night lamp|night light|projector|diffuser|ashtray|tissue box|frame/i,
    "Home Decor",
  ],
];

function classify(name) {
  for (const [pattern, category] of rules) {
    if (pattern.test(name)) return category;
  }
  return null;
}

await mongoose.connect(process.env.MONGODB_URI);

const products = mongoose.connection.db.collection("products");
const all = await products.find({}).toArray();

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

  updates.push({ _id: product._id, name, from: product.category, to: target });
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
  const result = await products.bulkWrite(
    updates.map((update) => ({
      updateOne: {
        filter: { _id: update._id },
        update: { $set: { category: update.to, updatedAt: new Date() } },
      },
    }))
  );

  console.log(`\nUpdated ${result.modifiedCount} product(s).`);
} else {
  console.log("\nNothing to do.");
}

await mongoose.disconnect();
