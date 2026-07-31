/**
 * Puts the catalog on sale, so the crossed-out price on every card is real.
 *
 *   node scripts/set-sale.mjs 10                 # show what a 10% sale would do
 *   node scripts/set-sale.mjs 10 --apply         # run it
 *   node scripts/set-sale.mjs 10 --category "Watches" --apply
 *   node scripts/set-sale.mjs --end --apply      # take everything off sale
 *
 * The price the shop is charging right now becomes compareAtPrice, and the new
 * selling price is that figure less the discount. That is what makes the strike
 * honest: the product genuinely sold at the crossed-out price until this ran.
 *
 * Inventing a higher "was" price instead would be a false discount claim — it
 * advertises a saving no shopper ever had, and it is what gets a shop's Google
 * Merchant Center listings suspended. This script cannot produce one: it only
 * ever copies a price the shop actually charged.
 *
 * Re-running is safe. A product already on sale keeps its original compare
 * price rather than compounding, so a second 10% run does not quietly become
 * 19% off the wrong baseline.
 */
import { prisma } from "./lib/db.mjs";

const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const ending = argv.includes("--end");

const categoryFlag = argv.indexOf("--category");
const category = categoryFlag === -1 ? null : argv[categoryFlag + 1];

const percent = Number(argv.find((arg) => /^\d+(\.\d+)?$/.test(arg)));

if (!ending && !(percent > 0 && percent < 90)) {
  console.error(
    "Give a discount between 1 and 89, e.g. node scripts/set-sale.mjs 10\n" +
      "Or pass --end to take the catalog off sale."
  );
  process.exit(1);
}

/** Sale price, rounded to end in a 9 the way the rest of the catalog does. */
function salePrice(was) {
  const cut = was * (1 - percent / 100);
  return Math.max(Math.round(cut / 10) * 10 - 1, 9);
}

const where = category ? { category } : {};
const dbRows = await prisma.product.findMany({ where });

// Decimal columns come back as decimal.js instances, not plain numbers — the
// arithmetic below needs real numbers.
const rows = dbRows.map((row) => ({
  ...row,
  price: Number(row.price),
  compareAtPrice: row.compareAtPrice === null ? null : Number(row.compareAtPrice),
}));

if (rows.length === 0) {
  console.log(
    category ? `No products in "${category}".` : "No products in the catalog."
  );
  await prisma.$disconnect();
  process.exit(0);
}

const scope = category ? `"${category}"` : "the whole catalog";

if (ending) {
  const onSale = rows.filter((p) => p.compareAtPrice != null);

  console.log(`${onSale.length} product(s) on sale in ${scope}.\n`);

  for (const product of onSale.slice(0, 5)) {
    console.log(
      `  Rs ${product.price} → Rs ${product.compareAtPrice}   ${product.name.slice(0, 48)}`
    );
  }

  if (onSale.length > 5) console.log(`  ...and ${onSale.length - 5} more`);

  console.log(
    "\nEnding the sale restores each product to its compare price and clears the strike."
  );

  if (!apply) {
    console.log("\nDry run. Re-run with --apply to write it.");
  } else {
    const result = await prisma.$transaction(
      onSale.map((product) =>
        prisma.product.update({
          where: { id: product.id },
          data: { price: product.compareAtPrice, compareAtPrice: null },
        })
      )
    );

    console.log(`\nDatabase: ${result.length} product(s) taken off sale.`);
  }

  await prisma.$disconnect();
  process.exit(0);
}

// A product already on sale keeps the price it originally sold at, so the
// saving on the card stays the one the shopper could really have paid.
const planned = rows.map((product) => {
  const was = product.compareAtPrice ?? product.price;

  return { product, was, now: salePrice(was) };
});

// A cut that rounds away to nothing is not a sale; leave those alone rather
// than putting a "0% off" strike on them.
const changing = planned.filter((row) => row.now < row.was);
const skipped = planned.length - changing.length;

console.log(`${percent}% off ${scope} — ${changing.length} product(s)\n`);

for (const row of changing.slice(0, 8)) {
  const off = Math.round(((row.was - row.now) / row.was) * 100);

  console.log(
    `  Rs ${String(row.was).padStart(5)} → Rs ${String(row.now).padStart(5)}  (${String(off).padStart(2)}% off)   ${row.product.name.slice(0, 44)}`
  );
}

if (changing.length > 8) console.log(`  ...and ${changing.length - 8} more`);

if (skipped > 0) {
  console.log(`\n${skipped} product(s) skipped — too cheap for the cut to show.`);
}

const wasTotal = changing.reduce((sum, row) => sum + row.was, 0);
const nowTotal = changing.reduce((sum, row) => sum + row.now, 0);

console.log(
  `\nCatalog value: Rs ${wasTotal.toLocaleString()} → Rs ${nowTotal.toLocaleString()}`
);
console.log(
  `Given away on a full sell-through: Rs ${(wasTotal - nowTotal).toLocaleString()}`
);
console.log(
  "\nEvery crossed-out price below is a price this shop is charging right now,\n" +
    "so the saving on the card is one a shopper could genuinely have paid."
);

if (!apply) {
  console.log("\nDry run. Re-run with --apply to write it.");
  await prisma.$disconnect();
  process.exit(0);
}

const result = await prisma.$transaction(
  changing.map((row) =>
    prisma.product.update({
      where: { id: row.product.id },
      data: { price: row.now, compareAtPrice: row.was },
    })
  )
);

console.log(`\nDatabase: ${result.length} product(s) put on sale.`);
console.log("Run with --end --apply to take the catalog off sale again.");

await prisma.$disconnect();
