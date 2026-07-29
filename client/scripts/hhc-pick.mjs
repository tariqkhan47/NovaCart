/**
 * Picks new stock off the supplier and adds it to the catalog.
 *
 *   node scripts/hhc-pick.mjs                      # show what it would add
 *   node scripts/hhc-pick.mjs --apply              # write it into hhc-catalog.json
 *   node scripts/hhc-pick.mjs --count=50 --apply   # a smaller batch
 *   node scripts/hhc-pick.mjs --max-cost=500       # supplier price ceiling
 *
 * Walks HHC's own categories, keeps what fits the brief, and spreads the
 * selection across the shop's collections rather than taking whatever the
 * supplier happened to list first — 267 products all from one aisle is not a
 * shop.
 *
 * What it writes into hhc-catalog.json is the same shape the rest of the
 * tooling expects, so the follow-up is the usual run:
 *
 *   node scripts/seed-products.mjs        # into the database
 *   node scripts/rehost-images.mjs --apply  # photos onto the shop's storage
 *
 * Needs HHC_TOKEN — see scripts/hhc-details.mjs for where that comes from.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { classify } from "../lib/classify-product.mjs";
import { productProse } from "../lib/product-copy.mjs";
import { sanitizeHtml, imagesIn, isWorthKeeping, stripShortcodes } from "../lib/rich-text.mjs";

const API = "https://member.hhcdropshipping.com/api/dropshipper";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const DELAY_MS = 220;

const apply = process.argv.includes("--apply");

const numeric = (flag, fallback) =>
  Number(
    process.argv.find((arg) => arg.startsWith(`--${flag}=`))?.slice(flag.length + 3)
  ) || fallback;

const COUNT = numeric("count", 267);
const MAX_COST = numeric("max-cost", 500);

// What the shop adds on top of the supplier's price for this batch. Flat,
// unlike the tiered markup the original catalog was priced with — see
// scripts/reprice-products.mjs, which still owns those.
const MARKUP = 0.5;

// Below this the supplier is running the line down and it will be out of stock
// before it has earned its place on the page.
const MIN_QUANTITY = 10;

// The shop already has more of these than it can sell, and the brief for this
// batch was explicitly everything except.
const EXCLUDED = new Set(["Watches", "Smart Watches"]);

// Categories worth walking. HHC's own aisles, not the shop's — its Groceries,
// Packaging and Raw Materials are wholesale supply rather than anything a
// retail customer buys, and Automotive is a different shop entirely.
const SOURCE_CATEGORIES = [
  "home-living",
  "fashion-apparel",
  "health-beauty",
  "electronics-appliances",
  "books-stationery",
  "kids-accessories",
  "events-gifting",
  "travel-outdoor",
  "tools-diy",
  "islamic-cultural",
  "pets-animals",
];

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function hhc(path, uat) {
  const res = await fetch(`${API}/${path}`, {
    headers: {
      Authorization: `Bearer ${uat}`,
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (res.status === 401) {
    console.error(`\n401 from ${path} — the session token has expired.`);
    process.exit(1);
  }

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  return res.json();
}

/**
 * What the customer pays: the supplier's price plus the markup, rounded to the
 * nearest ten and dropped by one so it ends in a 9 — the same shape the rest
 * of the catalog's prices have.
 */
function retailPrice(cost) {
  return Math.max(Math.round((cost * (1 + MARKUP)) / 10) * 10 - 1, 9);
}

/** Quill's bulleted lists, which it spells as <ol> — see scripts/hhc-details.mjs. */
function unquill(html) {
  return String(html ?? "").replace(
    /<ol\b[^>]*>([\s\S]*?)<\/ol>/gi,
    (whole, items) =>
      /data-list\s*=\s*["']?bullet/i.test(items) ? `<ul>${items}</ul>` : whole
  );
}

loadEnv();

const uat = (process.env.HHC_TOKEN || "").trim().replace(/^uat=/, "");

if (!uat) {
  console.error("HHC_TOKEN is not set (expected in .env.local).");
  process.exit(1);
}

const catalogPath = new URL("./hhc-catalog.json", import.meta.url);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

const have = new Set(catalog.map((product) => product.hhcId));
const haveNames = new Set(catalog.map((product) => product.name.trim().toLowerCase()));

console.log(`${catalog.length} product(s) already in the catalog`);
console.log(`Looking for ${COUNT} more at up to Rs ${MAX_COST} supplier cost\n`);

// --- gather ----------------------------------------------------------------

const candidates = [];
const seen = new Set();

for (const category of SOURCE_CATEGORIES) {
  let page = 1;
  let last = 1;
  let kept = 0;

  while (page <= last) {
    let body;

    try {
      body = await hhc(
        `products?category=${category}&paginate=50&page=${page}`,
        uat
      );
    } catch (error) {
      console.error(`  ${category} p${page}: ${error.message}`);
      page += 1;
      await sleep(DELAY_MS * 3);
      continue;
    }

    last = body.last_page ?? 1;

    for (const row of body.data ?? []) {
      if (!row?.id || seen.has(row.id) || have.has(row.id)) continue;
      seen.add(row.id);

      const name = String(row.name ?? "").trim();
      const cost = Number(row.wholesalePrice);

      if (!name || !Number.isFinite(cost) || cost <= 0 || cost > MAX_COST) continue;
      if (row.stockStatus !== 1 || Number(row.quantity) < MIN_QUANTITY) continue;

      // By name as well as by id. The supplier lists the same product several
      // times under different ids — one Islamic wall frame set appeared four
      // times — and seed-products.mjs matches on name, so the extras would be
      // written into the catalog and then silently skipped at the database,
      // leaving the file claiming stock the shop does not have.
      if (haveNames.has(name.toLowerCase())) continue;
      haveNames.add(name.toLowerCase());
      if (!row.detail?.slug || !row.product_thumbnail?.original_url) continue;

      // The classifier is what decides the collection, and it is also the only
      // thing standing between "no watches" and a page full of them: anything
      // it reads as a watch is dropped whatever aisle HHC filed it under.
      const collection = classify(name);
      if (!collection || EXCLUDED.has(collection)) continue;

      candidates.push({
        hhcId: row.id,
        name,
        cost,
        quantity: Number(row.quantity),
        slug: row.detail.slug,
        image: row.product_thumbnail.original_url,
        category: collection,
      });

      kept += 1;
    }

    page += 1;
    await sleep(DELAY_MS);
  }

  console.log(`  ${category.padEnd(24)} ${String(kept).padStart(4)} candidate(s)`);
}

console.log(`\n${candidates.length} candidate(s) after filtering\n`);

// --- choose ----------------------------------------------------------------

// Grouped by collection, then taken a few at a time from each in turn, so a
// category with two thousand cheap items cannot crowd out the rest.
const byCategory = new Map();

for (const product of candidates) {
  if (!byCategory.has(product.category)) byCategory.set(product.category, []);
  byCategory.get(product.category).push(product);
}

for (const list of byCategory.values()) {
  // Best stocked first: a supplier holding 500 of something is committed to
  // it, and it is less likely to sell out the week it goes on the site.
  list.sort((a, b) => b.quantity - a.quantity);
}

const chosen = [];
const queues = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length);

while (chosen.length < COUNT && queues.some(([, list]) => list.length > 0)) {
  for (const [, list] of queues) {
    if (chosen.length >= COUNT) break;
    const next = list.shift();
    if (next) chosen.push(next);
  }
}

console.log(`${chosen.length} chosen:\n`);

const spread = new Map();
for (const product of chosen) {
  spread.set(product.category, (spread.get(product.category) ?? 0) + 1);
}

for (const [category, n] of [...spread].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}  ${category}`);
}

const costs = chosen.map((p) => p.cost).sort((a, b) => a - b);

if (costs.length > 0) {
  console.log(
    `\ncost Rs ${costs[0]}–${costs.at(-1)}, ` +
      `sells for Rs ${retailPrice(costs[0])}–${retailPrice(costs.at(-1))} ` +
      `(${MARKUP * 100}% markup)`
  );
}

if (chosen.length === 0) {
  console.log("\nNothing to add.");
  process.exit(0);
}

if (!apply) {
  console.log("\nDry run — no descriptions fetched, nothing written.");
  console.log("Re-run with --apply to pull the descriptions and write the catalog.");
  process.exit(0);
}

// --- descriptions ----------------------------------------------------------

console.log(`\nFetching ${chosen.length} description(s)...`);

const added = [];
let noDescription = 0;

for (const [index, product] of chosen.entries()) {
  let detailHtml = "";
  let shortDesc = "";

  try {
    const payload = await hhc(`product/slug/${product.slug}`, uat);
    const detail = payload?.detail ?? {};

    shortDesc = stripShortcodes(detail.shortDesc ?? "");

    const html = sanitizeHtml(unquill(detail.description ?? ""));

    const gallery = (payload?.product_galleries ?? [])
      .map((row) => row?.original_url)
      .filter(
        (url) =>
          typeof url === "string" &&
          /^https:\/\//i.test(url) &&
          /\.(jpe?g|png|webp|gif|avif)$/i.test(url.split("?")[0]) &&
          url !== product.image
      )
      .map(
        (url) =>
          `<img src="${url}" alt="${product.name.replace(/[<>"]/g, "")}" loading="lazy" />`
      );

    const combined = [html, ...(imagesIn(html).length > 0 ? [] : gallery)]
      .filter(Boolean)
      .join("\n");

    if (isWorthKeeping(combined)) detailHtml = sanitizeHtml(combined);
    else noDescription += 1;
  } catch {
    noDescription += 1;
  }

  // A product with nothing to say about it still beats a gap in the shelf, so
  // the name carries it — but the short line has to exist, because the card and
  // the cart row both print it.
  const description = shortDesc || `${product.name}.`;

  const entry = {
    name: product.name,
    price: retailPrice(product.cost),
    costPrice: product.cost,
    description,
    seoDescription: productProse({ ...product, description }),
    category: product.category,
    image: product.image,
    stock: Math.min(product.quantity, 500),
    ...(detailHtml ? { detailHtml } : {}),
    hhcId: product.hhcId,
  };

  added.push(entry);

  if ((index + 1) % 25 === 0) console.log(`  ${index + 1}/${chosen.length}`);

  await sleep(DELAY_MS);
}

console.log(`\n${added.length} added, ${noDescription} without a long description.`);

writeFileSync(
  catalogPath,
  JSON.stringify([...catalog, ...added], null, 1) + "\n",
  "utf8"
);

console.log(`Catalog now holds ${catalog.length + added.length} product(s).`);
console.log("\nNext:");
console.log("  node scripts/seed-products.mjs");
console.log("  node scripts/rehost-images.mjs --apply");
