/**
 * Adds everything on the supplier's wishlist to the catalog.
 *
 *   node scripts/hhc-wishlist.mjs                  # show what it would add
 *   node scripts/hhc-wishlist.mjs --apply          # write it into hhc-catalog.json
 *   node scripts/hhc-wishlist.mjs --markup=40      # a different margin
 *   node scripts/hhc-wishlist.mjs --apply --no-feature   # add without featuring
 *
 * The wishlist is what the owner has starred by hand on
 * member.hhcdropshipping.com, so unlike hhc-pick.mjs this takes all of it:
 * no category quotas, no price ceiling, no filtering by stock. The picking
 * already happened, in their browser.
 *
 * Two things it does that hhc-pick does not. It marks every entry
 * `featured: true`, because these are the products meant for the home page's
 * Featured row — and that flag has to go in the **catalog**, not just the
 * database, since sync-featured.mjs treats the catalog as the source of truth
 * and clears the flag from any row the file does not name. And it reads the
 * slug straight off `detail.slug` in the wishlist payload, so it never needs
 * the 170-page walk hhc-details.mjs does to map ids to slugs.
 *
 * The usual follow-up afterwards:
 *
 *   node scripts/seed-products.mjs           # into the database
 *   node scripts/sync-featured.mjs --apply   # the Featured row
 *   node scripts/localize-images.mjs --apply # photos onto the shop's own server
 *
 * Needs HHC_TOKEN — see scripts/hhc-details.mjs for where that comes from.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { classify } from "../lib/classify-product.mjs";
import { productProse } from "../lib/product-copy.mjs";
import {
  sanitizeHtml,
  imagesIn,
  isWorthKeeping,
  stripShortcodes,
} from "../lib/rich-text.mjs";

const API = "https://member.hhcdropshipping.com/api/dropshipper";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const DELAY_MS = 220;

const apply = process.argv.includes("--apply");
const noFeature = process.argv.includes("--no-feature");

const markupArg = process.argv.find((a) => a.startsWith("--markup="));
const MARKUP = (markupArg ? Number(markupArg.slice("--markup=".length)) : 60) / 100;

if (!Number.isFinite(MARKUP) || MARKUP < 0) {
  console.error("--markup must be a number, e.g. --markup=60");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Fall through to whatever is already in the environment.
  }
}

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
    console.error("Get a fresh uat cookie from a logged-in tab; see hhc-details.mjs.");
    process.exit(1);
  }

  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);

  return res.json();
}

/** Supplier cost to shelf price: markup, then round to the nearest x9. */
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

const haveId = new Set(catalog.map((product) => product.hhcId));
// Matched on name as well as id: the supplier lists the same item more than
// once under different ids, and seed-products.mjs dedupes by name, so an entry
// that slipped past the id check would be written to the file and then
// silently never reach the database.
const haveName = new Set(
  catalog.map((product) => String(product.name ?? "").trim().toLowerCase())
);

// --- the wishlist ----------------------------------------------------------

const rows = [];

for (let page = 1; ; page++) {
  const payload = await hhc(`wishlist?page=${page}`, uat);
  const batch = payload?.data ?? [];

  rows.push(...batch);

  console.log(`  page ${page}/${payload?.last_page ?? 1} — ${rows.length} item(s)`);

  if (!payload?.last_page || page >= payload.last_page) break;

  await sleep(DELAY_MS);
}

console.log(`\n${rows.length} product(s) on the wishlist.`);

const candidates = [];
const already = [];
const unclassified = [];

for (const row of rows) {
  const name = String(row?.name ?? "").trim();
  const cost = Number(row?.wholesalePrice);

  if (!name || !Number.isFinite(cost) || cost <= 0) continue;

  if (haveId.has(row.id) || haveName.has(name.toLowerCase())) {
    already.push(name);
    continue;
  }

  const category = classify(name);

  // A product the rules cannot place would land in a collection page that does
  // not exist, so it is reported rather than filed somewhere wrong.
  if (!category) {
    unclassified.push(name);
    continue;
  }

  candidates.push({
    hhcId: row.id,
    name,
    cost,
    category,
    slug: row?.detail?.slug ?? null,
    image: row?.product_thumbnail?.original_url ?? null,
    quantity: Number(row?.quantity) || 0,
  });
}

console.log(`  ${already.length} already in the catalog`);
console.log(`  ${unclassified.length} could not be placed in a collection`);
console.log(`  ${candidates.length} to add, at ${Math.round(MARKUP * 100)}% markup\n`);

for (const product of unclassified) {
  console.log(`  unplaced: ${product.slice(0, 70)}`);
}

if (unclassified.length > 0) console.log();

for (const product of candidates) {
  console.log(
    `  ${String(product.hhcId).padEnd(9)} Rs ${String(product.cost).padStart(5)} → ` +
      `Rs ${String(retailPrice(product.cost)).padStart(5)}  ${product.category.padEnd(22)} ` +
      `${product.name.slice(0, 44)}`
  );
}

if (candidates.length === 0) {
  console.log("\nNothing to add.");
  process.exit(0);
}

if (!apply) {
  console.log("\nDry run — no descriptions fetched, nothing written.");
  console.log("Re-run with --apply to pull the descriptions and write the catalog.");
  process.exit(0);
}

// --- descriptions ----------------------------------------------------------

console.log(`\nFetching ${candidates.length} description(s)...`);

const added = [];
let noDescription = 0;

for (const [index, product] of candidates.entries()) {
  let detailHtml = "";
  let shortDesc = "";

  if (product.slug) {
    try {
      const payload = await hhc(`product/slug/${product.slug}`, uat);
      const detail = payload?.detail ?? {};

      shortDesc = stripShortcodes(detail.shortDesc ?? "");

      const html = sanitizeHtml(unquill(detail.description ?? ""));

      // Only used when the write-up carries no pictures of its own — otherwise
      // the same photos appear twice down the page.
      const gallery = (payload?.product_galleries ?? [])
        .map((galleryRow) => galleryRow?.original_url)
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
    } catch (error) {
      console.log(`  ! ${product.name.slice(0, 50)} — ${error.message}`);
      noDescription += 1;
    }
  } else {
    noDescription += 1;
  }

  // The card and the cart row both print this, so it cannot be empty; the
  // name carries it when the supplier gave nothing.
  const description = shortDesc || `${product.name}.`;

  added.push({
    name: product.name,
    price: retailPrice(product.cost),
    costPrice: product.cost,
    description,
    seoDescription: productProse({ ...product, description }),
    category: product.category,
    image: product.image,
    stock: Math.min(product.quantity, 500),
    ...(detailHtml ? { detailHtml } : {}),
    ...(noFeature ? {} : { featured: true }),
    hhcId: product.hhcId,
  });

  if ((index + 1) % 10 === 0) console.log(`  ${index + 1}/${candidates.length}`);

  await sleep(DELAY_MS);
}

writeFileSync(catalogPath, JSON.stringify([...catalog, ...added], null, 1) + "\n", "utf8");

const withPhotos = added.filter((product) => product.detailHtml).length;
const photoCount = added.reduce(
  (total, product) => total + imagesIn(product.detailHtml ?? "").length,
  0
);

console.log(`\n${added.length} product(s) written to hhc-catalog.json.`);
console.log(`  ${withPhotos} with a full write-up, ${photoCount} photo(s) inside them`);
console.log(`  ${noDescription} with only the short line`);
if (!noFeature) console.log(`  all ${added.length} marked featured`);

console.log("\nNext:");
console.log("  node scripts/seed-products.mjs");
console.log("  node scripts/sync-featured.mjs --apply");
console.log("  node scripts/localize-images.mjs --apply");
