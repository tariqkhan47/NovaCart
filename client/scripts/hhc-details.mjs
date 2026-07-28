/**
 * Pulls the full product description — the long write-up and the photos inside
 * it — from the HHC dropshipping portal.
 *
 *   node scripts/hhc-details.mjs --probe    # dump one product's raw JSON
 *   node scripts/hhc-details.mjs            # fetch every product, show what would change
 *   node scripts/hhc-details.mjs --apply    # write the catalog and the database
 *   node scripts/hhc-details.mjs --limit=5  # try it on a handful first
 *   node scripts/hhc-details.mjs --apply --db-only   # re-push the catalog file to the database
 *   node scripts/hhc-details.mjs --apply --force     # re-pull copy already imported
 *
 * What seed-products.mjs imported is only the one-line blurb the list endpoint
 * returns, and a third of those arrive cut off mid-word. The real description —
 * the one with the feature photos in it — only exists on the detail endpoint,
 * one request per product.
 *
 * The HTML is cleaned before it is stored, by the same sanitizer the admin form
 * writes through (lib/rich-text.mjs). It is written by other people on someone
 * else's portal, so storing it raw would put a script tag on every product page
 * the moment one appeared in their copy.
 *
 * Authentication: HHC has no API key. It authenticates the browser session, so
 * this needs the `uat` JWT out of a logged-in tab:
 *
 *   1. Sign in at member.hhcdropshipping.com
 *   2. DevTools Console → copy(document.cookie)
 *   3. Take the uat=... value
 *
 * Pass it as HHC_TOKEN in .env.local, or --token=<jwt>. Tokens expire, so a
 * 401 here means fetching a new one rather than anything being broken. The
 * browser User-Agent below is also required: without it the WAF answers 403.
 */
import mongoose from "mongoose";
import { readFileSync, writeFileSync } from "node:fs";
import {
  sanitizeHtml,
  htmlToText,
  imagesIn,
  isWorthKeeping,
} from "../lib/rich-text.mjs";
import { shortName } from "../lib/product-copy.mjs";

const API = "https://member.hhcdropshipping.com/api/dropshipper";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

// One request at a time with a pause between: 233 products is a lot of calls to
// aim at a supplier's portal, and getting the account rate-limited would cost
// more than the minute this saves.
const DELAY_MS = 350;

const apply = process.argv.includes("--apply");
const probe = process.argv.includes("--probe");
// Push what the last run already wrote into the catalog file, without going
// back to the supplier for it.
const dbOnly = process.argv.includes("--db-only");
// Re-pull descriptions already imported, rather than leaving them as they are.
const force = process.argv.includes("--force");
const limit = Number(
  process.argv.find((arg) => arg.startsWith("--limit="))?.slice("--limit=".length)
) || Infinity;

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

function token() {
  const flag = process.argv
    .find((arg) => arg.startsWith("--token="))
    ?.slice("--token=".length);

  // Pasting the whole cookie string is the obvious mistake, and picking uat out
  // of it here is cheaper than making someone edit a JWT by hand.
  const raw = (flag || process.env.HHC_TOKEN || "").trim();
  const value = raw.match(/(?:^|;\s*)uat=([^;]+)/)?.[1] ?? raw;

  if (!value) {
    console.error(
      "No HHC session token. Sign in at member.hhcdropshipping.com, run\n" +
        "copy(document.cookie) in the DevTools Console, and pass the uat=\n" +
        "value as --token=<jwt> or HHC_TOKEN in .env.local."
    );
    process.exit(1);
  }

  return decodeURIComponent(value);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** One GET against the portal, with the headers it insists on. */
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
    console.error("Grab a fresh uat= out of a logged-in tab and run this again.");
    process.exit(1);
  }

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} from ${path}`);
  }

  return res.json();
}

/**
 * hhcId → slug, for the products this shop actually stocks.
 *
 * The detail endpoint is addressed by slug, and the slug is not something the
 * seeding run kept, so it has to be read back off the list endpoint first.
 *
 * HHC's catalog runs to 8,000-odd products against this shop's 233, so the walk
 * stops the moment the last one is accounted for rather than paging to the end.
 * Newest first is the order the portal returns, which is roughly the order they
 * were picked in, so in practice this stops early.
 */
async function slugsById(uat, wantedIds) {
  const byId = new Map();

  for (let page = 1; ; page += 1) {
    const body = await hhc(`products?paginate=50&page=${page}`, uat);
    const rows = body?.data ?? [];

    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const row of rows) {
      // The slug lives on the nested `detail` record, not the product row.
      const slug = row?.detail?.slug ?? row?.slug;

      if (row?.id && slug && wantedIds.has(row.id)) byId.set(row.id, slug);
    }

    console.log(
      `  page ${page}/${body?.last_page ?? "?"} — ${byId.size}/${wantedIds.size} matched`
    );

    if (byId.size === wantedIds.size) break;
    if (body?.last_page && page >= body.last_page) break;

    await sleep(DELAY_MS);
  }

  return byId;
}

/** The product object inside whatever envelope the endpoint wrapped it in. */
function unwrap(payload) {
  return payload?.data?.product ?? payload?.product ?? payload?.data ?? payload;
}

/**
 * The long description, as HTML.
 *
 * `detail.shortDesc` is the one-liner the seeding run already imported;
 * `detail.description` is the write-up this script exists to fetch. The other
 * names are there because the portal is not consistent about which endpoint
 * spells it which way, and taking the longest match separates a sentence from
 * paragraphs reliably.
 */
function describedIn(product) {
  const candidates = [
    product?.detail?.description,
    product?.description,
    product?.long_description,
    product?.longDescription,
    product?.content,
  ].filter((value) => typeof value === "string" && value.trim());

  return candidates.sort((a, b) => b.length - a.length)[0] ?? "";
}

/**
 * Quill's markup, turned into the list it is meant to look like.
 *
 * HHC's copy is written in a Quill editor, which spells a bulleted list as an
 * <ol> whose items carry data-list="bullet" and leans on its own stylesheet to
 * draw the bullets. The sanitizer drops attributes, so left alone every feature
 * list on the site would come out numbered 1..13 — the supplier's page shows
 * bullets, and this is what keeps them.
 */
function unquill(html) {
  return String(html ?? "").replace(
    /<ol\b[^>]*>([\s\S]*?)<\/ol>/gi,
    (whole, items) =>
      /data-list\s*=\s*["']?bullet/i.test(items) ? `<ul>${items}</ul>` : whole
  );
}

/**
 * The gallery photos.
 *
 * This catalog keeps the feature shots in `product_galleries` rather than
 * inline in the copy, so without these a description would arrive as a wall of
 * text — and the pictures are most of what sells the product.
 *
 * Videos live in the same array. There is no <video> in the sanitizer's
 * allowlist and no player on the product page, so they are left out rather than
 * turned into a broken image.
 */
function galleryOf(product) {
  const rows =
    product?.product_galleries ?? product?.images ?? product?.gallery ?? [];

  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) =>
      typeof row === "string" ? row : row?.original_url ?? row?.url ?? row?.path
    )
    .filter(
      (url) =>
        typeof url === "string" &&
        /^https:\/\//i.test(url) &&
        /\.(jpe?g|png|webp|gif|avif)$/i.test(url.split("?")[0])
    );
}

/**
 * One product's description, cleaned and ready to store — or "" when the
 * portal has nothing better than what the catalog already holds.
 */
function detailHtmlFor(payload, { skipImage, name } = {}) {
  const product = unwrap(payload);
  const html = sanitizeHtml(unquill(describedIn(product)));

  // The supplier ships these with no alt text at all. The product's own name is
  // not a description of the photo, but it is true of every one of them, and it
  // beats leaving a screen reader with seven unannounced images.
  const alt = shortName(name ?? product?.name).replace(/[<>"]/g, "");

  // Only fall back to the gallery when the copy carries no photos of its own,
  // so a description with pictures in it is not followed by the same pictures
  // again underneath.
  const extra =
    imagesIn(html).length > 0
      ? []
      : galleryOf(product)
          // The main catalogue photo is already at the top of the page.
          .filter((url) => url !== skipImage)
          .map((url) => `<img src="${url}" alt="${alt}" loading="lazy" />`);

  const combined = [html, ...extra].filter(Boolean).join("\n");

  return isWorthKeeping(combined) ? sanitizeHtml(combined) : "";
}

// --- probe -----------------------------------------------------------------
// Fetch one product and print the raw response, so the shape of the description
// and its images can be read off the portal rather than guessed at.

loadEnv();

const catalogPath = new URL("./hhc-catalog.json", import.meta.url);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

// --db-only never calls the portal, so it must not insist on a live session.
const uat = dbOnly ? "" : token();

if (probe) {
  const wanted = catalog[0];
  console.log(`Looking up "${wanted.name.slice(0, 60)}" (hhcId ${wanted.hhcId})\n`);

  const slugs = await slugsById(uat, new Set([wanted.hhcId]));
  const slug = slugs.get(wanted.hhcId);

  if (!slug) {
    console.error(`hhcId ${wanted.hhcId} is not in the portal's list any more.`);
    process.exit(1);
  }

  console.log(`\nGET product/slug/${slug}\n`);
  console.log(JSON.stringify(await hhc(`product/slug/${slug}`, uat), null, 2));
  process.exit(0);
}

// --- import ----------------------------------------------------------------

const wanted = catalog.slice(0, limit === Infinity ? catalog.length : limit);
const found = new Map();
const missing = [];
const empty = [];

if (dbOnly) {
  // Replaying what the last run already fetched. The database is the half of
  // this that fails on a flaky connection, and re-pulling 233 descriptions off
  // the supplier to fix a DNS timeout is a bad trade.
  for (const product of wanted) {
    if (product.detailHtml) found.set(product.hhcId, product.detailHtml);
  }

  console.log(`${found.size} description(s) read back from the catalog file.\n`);
} else {
  console.log(`Mapping ${catalog.length} product(s) to their portal slugs...`);

  const slugs = await slugsById(
    uat,
    new Set(catalog.map((product) => product.hhcId))
  );

  for (const [index, product] of wanted.entries()) {
    const slug = slugs.get(product.hhcId);

    process.stdout.write(
      `\r  ${index + 1}/${wanted.length} — ${found.size} description(s) pulled`
    );

    // Already imported. Re-running after a failure or a token expiry should
    // cost one request per product still outstanding, not 233 — the supplier's
    // copy does not change often enough to be worth re-pulling wholesale.
    if (product.detailHtml && !force) {
      found.set(product.hhcId, product.detailHtml);
      continue;
    }

    if (!slug) {
      // Delisted at the supplier's end. Worth reporting rather than silently
      // skipping: it means the shop is still selling something HHC has dropped.
      missing.push(product.name);
      continue;
    }

    try {
      const payload = await hhc(`product/slug/${slug}`, uat);
      const html = detailHtmlFor(payload, {
        skipImage: product.image,
        name: product.name,
      });

      if (html) found.set(product.hhcId, html);
      else empty.push(product.name);
    } catch (error) {
      missing.push(`${product.name} (${error.message})`);
    }

    await sleep(DELAY_MS);
  }

  process.stdout.write("\n");
}

console.log("");

const totalImages = [...found.values()].reduce(
  (sum, html) => sum + imagesIn(html).length,
  0
);

console.log(
  `${found.size} description(s) pulled, with ${totalImages} photo(s) between them.`
);

if (empty.length > 0) {
  console.log(
    `${empty.length} had nothing longer than the blurb already stored — left as they are.`
  );
}

if (missing.length > 0) {
  console.log(`\n${missing.length} could not be fetched:`);
  for (const name of missing.slice(0, 10)) console.log(`  ${name.slice(0, 70)}`);
  if (missing.length > 10) console.log(`  ...and ${missing.length - 10} more`);
}

// A sample, so a bad extraction is visible before it reaches the database.
for (const product of wanted.slice(0, 3)) {
  const html = found.get(product.hhcId);
  if (!html) continue;

  console.log(`\n  ${product.name.slice(0, 60)}`);
  console.log(`    ${imagesIn(html).length} photo(s), ${htmlToText(html).length} characters`);
  console.log(`    ${htmlToText(html).slice(0, 140)}...`);
}

if (found.size === 0) {
  console.log("\nNothing to write.");
  process.exit(0);
}

if (!apply) {
  console.log("\nDry run. Re-run with --apply to write the catalog and the database.");
  process.exit(0);
}

// Keep the field order the file already had, with detailHtml after the short
// description it expands on and hhcId last.
writeFileSync(
  catalogPath,
  JSON.stringify(
    catalog.map(({ name, price, costPrice, description, seoDescription, hhcId, ...rest }) => {
      const { detailHtml: previous, ...others } = rest;

      return {
        name,
        price,
        costPrice,
        description,
        seoDescription,
        ...(found.get(hhcId) || previous
          ? { detailHtml: found.get(hhcId) ?? previous }
          : {}),
        ...others,
        hhcId,
      };
    }),
    null,
    1
  ) + "\n",
  "utf8"
);

console.log("\nCatalog updated.");

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (expected in .env.local) — database not updated");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const products = mongoose.connection.db.collection("products");

// Matched on name because the catalog file has no record of the _id the seeding
// run generated, and the names are what the store shows.
const byName = new Map(
  catalog
    .filter((product) => found.has(product.hhcId))
    .map((product) => [product.name, found.get(product.hhcId)])
);

const rows = await products
  .find({ name: { $in: [...byName.keys()] } })
  .project({ name: 1 })
  .toArray();

const updates = rows.map((row) => ({
  updateOne: {
    filter: { _id: row._id },
    update: { $set: { detailHtml: byName.get(row.name), updatedAt: new Date() } },
  },
}));

if (updates.length === 0) {
  console.log("Database: no matching products found.");
} else {
  const result = await products.bulkWrite(updates);
  console.log(`Database: ${result.modifiedCount} product(s) updated.`);
}

await mongoose.disconnect();
