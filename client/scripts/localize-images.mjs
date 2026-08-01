/**
 * Brings the catalog's photos onto the shop's own server.
 *
 *   node scripts/localize-images.mjs             # show what would move
 *   node scripts/localize-images.mjs --apply     # download, then rewrite the links
 *   node scripts/localize-images.mjs --limit=20  # try it on a handful first
 *   node scripts/localize-images.mjs --apply --force   # re-download files already here
 *
 * This is the sequel to rehost-images.mjs, and undoes half of it. That script
 * moved every photo off the supplier's CDN onto Vercel Blob, which was the
 * right home while the shop ran on Vercel. The shop now runs on Hostinger, so
 * the pictures are the last thing still living on an account the owner has
 * otherwise left — and the day that account lapses, all ~2,200 of them go dark
 * at once, on a shop that is taking real orders. So they come home: downloaded
 * into public/img/ and referenced by a path rather than a URL.
 *
 * Nothing is re-encoded on the way. rehost-images.mjs already resized these to
 * 1400px WebP; running them through sharp a second time would cost quality for
 * no saving. Sources that are *not* already WebP — anything hotlinked that the
 * earlier migration missed — are converted, so everything under public/img/ is
 * one format.
 *
 * Filenames are kept exactly as the blob store had them (a sha1 of the original
 * supplier URL), so this can be re-run, resumed after a Ctrl-C, and compared
 * against the old store by eye. A file already on disk is never fetched twice.
 */
import sharp from "sharp";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { prisma } from "./lib/db.mjs";

const apply = process.argv.includes("--apply");
const force = process.argv.includes("--force");
const limit =
  Number(
    process.argv.find((a) => a.startsWith("--limit="))?.slice("--limit=".length)
  ) || Infinity;

// Kept well below what a shared host will happily open at once — this is
// pulling from Vercel's CDN, not from the database, but a hundred parallel
// sockets on a home connection is how you get half of them timing out.
const CONCURRENCY = 8;

const QUALITY = 82;

// Deliberately not public/products/: the app already routes /products/[id],
// and a static file and a dynamic route sharing a prefix is a coin-toss over
// which one answers. /img/ collides with nothing.
const PUBLIC_DIR = fileURLToPath(new URL("../public/img/", import.meta.url));

/** Where a source URL ends up on disk — the blob store's own filename if it has one. */
function localName(url) {
  const fromBlob = url.match(
    /\.public\.blob\.vercel-storage\.com\/products\/([A-Za-z0-9._-]+)$/
  );

  if (fromBlob) return fromBlob[1];

  return `${createHash("sha1").update(url).digest("hex")}.webp`;
}

/** Thrown for a source that is gone for good, as opposed to a bad minute. */
class Gone extends Error {}

async function download(url, name) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Arsalah image migration" },
  });

  if (res.status >= 400 && res.status < 500) {
    throw new Gone(`${res.status} ${res.statusText}`);
  }

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  const body = Buffer.from(await res.arrayBuffer());

  // A 404 page served with a 200, or an .mp4, would otherwise land in public/
  // as a broken "image" and only be noticed on the live site.
  const meta = await sharp(body).metadata().catch(() => null);
  if (!meta?.width) return null;

  const bytes =
    meta.format === "webp"
      ? body
      : await sharp(body).webp({ quality: QUALITY }).toBuffer();

  writeFileSync(path.join(PUBLIC_DIR, name), bytes);

  return bytes.length;
}

/** Runs `task` over `items`, `CONCURRENCY` at a time. */
async function pooled(items, task) {
  const results = new Array(items.length);
  let next = 0;

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await task(items[i], i);
      }
    })
  );

  return results;
}

const IMG_SRC = /<img[^>]+src="([^"]+)"/g;
const ABSOLUTE = /^https?:\/\//i;

const rows = await prisma.product.findMany({
  select: { id: true, image: true, detailHtml: true },
});

const catalogPath = new URL("./hhc-catalog.json", import.meta.url);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

// Every distinct photo the shop shows, from both the database and the catalog
// file. A URL used by two products is one download, not two.
const sources = new Set();

const collect = (record) => {
  if (record.image && ABSOLUTE.test(record.image)) sources.add(record.image);

  for (const m of String(record.detailHtml ?? "").matchAll(IMG_SRC)) {
    if (ABSOLUTE.test(m[1])) sources.add(m[1]);
  }
};

rows.forEach(collect);
catalog.forEach(collect);

console.log(`${rows.length} products in the database`);
console.log(`${sources.size} distinct photo(s) still loaded from another server\n`);

if (sources.size === 0) {
  console.log("Nothing to do — every photo is already served from this shop.");
  await prisma.$disconnect();
  process.exit(0);
}

mkdirSync(PUBLIC_DIR, { recursive: true });

const wanted = [...sources].slice(0, limit === Infinity ? sources.size : limit);

let done = 0;
let fetched = 0;
let bytes = 0;
const failed = [];
const gone = new Set();

const mapped = await pooled(wanted, async (url) => {
  const name = localName(url);
  const target = path.join(PUBLIC_DIR, name);

  // Resume: an interrupted run should not pay for the same 2,000 downloads.
  if (!force && existsSync(target) && statSync(target).size > 0) {
    done += 1;
    return [url, name];
  }

  try {
    const size = await download(url, name);

    if (size === null) {
      gone.add(url);
      failed.push(`${url} (not an image)`);
      return null;
    }

    bytes += size;
    fetched += 1;
    done += 1;

    if (done % 100 === 0) console.log(`  ${done}/${wanted.length}`);

    return [url, name];
  } catch (error) {
    if (error instanceof Gone) gone.add(url);
    failed.push(`${url} (${error.message})`);
    return null;
  }
});

const urlMap = new Map(mapped.filter(Boolean).map(([url, name]) => [url, `/img/${name}`]));

console.log(`\n${urlMap.size} photo(s) available locally (${fetched} downloaded this run).`);
if (bytes > 0) console.log(`${(bytes / 1024 / 1024).toFixed(1)} MB fetched.`);

if (failed.length > 0) {
  console.log(`\n${failed.length} could not be fetched:`);
  for (const line of failed.slice(0, 15)) console.log(`  ${line.slice(0, 120)}`);
  if (failed.length > 15) console.log(`  ...and ${failed.length - 15} more`);

  // Written out so the HHC re-import has a list to work from rather than
  // needing this whole run repeated to find them again.
  writeFileSync(
    fileURLToPath(new URL("./missing-images.json", import.meta.url)),
    JSON.stringify([...gone], null, 1) + "\n",
    "utf8"
  );
  console.log(`\n  ${gone.size} written to scripts/missing-images.json`);
}

if (!apply) {
  console.log("\nDry run — links were not rewritten.");
  console.log("Re-run with --apply once the downloads look right.");
  await prisma.$disconnect();
  process.exit(0);
}

/** Every downloaded URL in a string swapped for its local path. */
const repoint = (text) => {
  if (typeof text === "string" && urlMap.has(text)) return urlMap.get(text);

  return String(text ?? "").replace(
    /https?:\/\/[^\s"'<>]+/g,
    (url) => urlMap.get(url) ?? url
  );
};

writeFileSync(
  catalogPath,
  JSON.stringify(
    catalog.map((product) => ({
      ...product,
      image: repoint(product.image),
      ...(product.detailHtml ? { detailHtml: repoint(product.detailHtml) } : {}),
    })),
    null,
    1
  ) + "\n",
  "utf8"
);

console.log("\nCatalog updated.");

const toUpdate = [];

for (const row of rows) {
  const image = repoint(row.image);
  const detailHtml = row.detailHtml ? repoint(row.detailHtml) : row.detailHtml;

  if (image === row.image && detailHtml === row.detailHtml) continue;

  toUpdate.push({ id: row.id, image, detailHtml });
}

if (toUpdate.length === 0) {
  console.log("Database: nothing needed rewriting.");
} else {
  // One row at a time, and deliberately not in a transaction. These are
  // LongText columns going over a remote connection to Hostinger, and a
  // batch of fifty inside prisma.$transaction blows the 5s interactive
  // transaction timeout long before it finishes (P2028). There is nothing to
  // roll back anyway: each rewrite is independent, and re-running is a no-op
  // because a path that has already been localised no longer matches the
  // absolute-URL pattern.
  let written = 0;

  for (const row of toUpdate) {
    await prisma.product.update({
      where: { id: row.id },
      data: { image: row.image, detailHtml: row.detailHtml },
    });

    written += 1;
    if (written % 50 === 0 || written === toUpdate.length) {
      console.log(`  database ${written}/${toUpdate.length}`);
    }
  }
}

// The number that actually matters: one missed URL is one picture that can
// still vanish when the Vercel account does.
const after = await prisma.product.findMany({
  select: { image: true, detailHtml: true },
});

const stragglers = after.filter(
  (row) =>
    ABSOLUTE.test(row.image) ||
    (row.detailHtml && /<img[^>]+src="https?:\/\//.test(row.detailHtml))
).length;

console.log(
  stragglers === 0
    ? "\nNo product loads a photo from anyone else's server."
    : `\n${stragglers} product(s) still load a photo from someone else's server.`
);

await prisma.$disconnect();
