/**
 * Moves the catalog's photos off the supplier's CDN and onto the shop's own
 * storage.
 *
 *   node scripts/rehost-images.mjs             # show what would move
 *   node scripts/rehost-images.mjs --apply     # download, upload, rewrite
 *   node scripts/rehost-images.mjs --limit=5   # try it on a handful first
 *   node scripts/rehost-images.mjs --apply --force   # re-upload ones already moved
 *
 * Every photo on the site — the catalog thumbnails and the ones inside the
 * supplier's write-ups — is currently an <img> pointing at HHC's DigitalOcean
 * bucket. Nothing about those files belongs to this shop: the day HHC tidies
 * up, reorganises, or drops a product, the picture disappears from a page the
 * shop is still selling from, and there is no warning and no way back.
 *
 * So each one is fetched once, re-encoded, and uploaded to Vercel Blob, and
 * every reference to it is rewritten to the new URL.
 *
 * The re-encode is not incidental. The supplier's originals average 437 KB and
 * run to 1.7 MB, sized for whatever their own page needed; at 1400px and WebP
 * they come out around 70 KB for the same picture on screen. That is two
 * thirds off every image on the site, which is felt most on the phones most of
 * this shop's customers are using.
 *
 * Needs BLOB_READ_WRITE_TOKEN in .env.local — Vercel dashboard → Storage →
 * the Blob store → the token beginning vercel_blob_rw_.
 */
import mongoose from "mongoose";
import sharp from "sharp";
import { put, list } from "@vercel/blob";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const apply = process.argv.includes("--apply");
const force = process.argv.includes("--force");
const limit =
  Number(
    process.argv.find((arg) => arg.startsWith("--limit="))?.slice("--limit=".length)
  ) || Infinity;

// Wide enough that the picture is still sharp on a laptop and on a phone at
// 2x, small enough that nothing arrives at 1.7 MB. Nothing is ever enlarged —
// a 225px thumbnail stays 225px rather than being blown up into a blurry one.
const MAX_EDGE = 1400;

// 82 is where WebP stops being visibly different from the original on product
// photography. Above it the file grows for detail nobody sees on a phone.
const QUALITY = 82;

// Uploads run a few at a time. Hobby allows 15 advanced operations a second
// and one-at-a-time would take twenty minutes for a thousand files.
const CONCURRENCY = 6;

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

/**
 * The name a photo is stored under: its original URL, hashed.
 *
 * The supplier's own filenames are already hashes and collide across dates, and
 * deriving the name from the source URL means a re-run recognises what it has
 * already uploaded instead of making a second copy of it.
 */
function blobKey(url) {
  return `products/${createHash("sha1").update(url).digest("hex")}.webp`;
}

/** Fetch, resize, re-encode. Returns null for anything that is not an image. */
async function repack(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "NovaCart image migration" },
  });

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  const original = Buffer.from(await res.arrayBuffer());

  // A 404 page or an .mp4 that slipped through would otherwise be uploaded as
  // a broken "image" and only noticed on the live site.
  const meta = await sharp(original).metadata().catch(() => null);
  if (!meta?.width) return null;

  const webp = await sharp(original)
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toBuffer();

  return { original: original.length, webp };
}

/** Runs `task` over `items`, `CONCURRENCY` at a time, in order. */
async function pooled(items, task) {
  const results = new Array(items.length);
  let next = 0;

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await task(items[index], index);
      }
    })
  );

  return results;
}

loadEnv();

const catalogPath = new URL("./hhc-catalog.json", import.meta.url);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

// Every distinct photo the shop shows, thumbnails and write-up pictures alike.
// A URL used by two products is one upload, not two.
const sources = new Set();

for (const product of catalog) {
  if (product.image) sources.add(product.image);

  for (const match of (product.detailHtml ?? "").matchAll(/<img src="([^"]+)"/g)) {
    sources.add(match[1]);
  }
}

// Already on the shop's own storage from an earlier run — those are the ones
// this exists to create, and re-uploading them would be pointless.
const remote = [...sources].filter((url) => !url.includes(".public.blob.vercel-storage.com"));

const wanted = remote.slice(0, limit === Infinity ? remote.length : limit);

console.log(`${sources.size} photo(s) on the site`);
console.log(`${sources.size - remote.length} already moved`);
console.log(`${wanted.length} to fetch from the supplier\n`);

if (wanted.length === 0) {
  console.log("Nothing to do.");
  process.exit(0);
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error(
    "BLOB_READ_WRITE_TOKEN is not set (expected in .env.local).\n" +
      "Vercel dashboard → Storage → the Blob store → the token beginning\n" +
      "vercel_blob_rw_."
  );
  process.exit(1);
}

// What is in the store already, so an interrupted run resumes instead of
// paying to upload the same thousand files twice.
const uploaded = new Map();

if (!force) {
  let cursor;

  do {
    const page = await list({ prefix: "products/", cursor, limit: 1000 });
    for (const blob of page.blobs) uploaded.set(blob.pathname, blob.url);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  if (uploaded.size > 0) {
    console.log(`${uploaded.size} already in the blob store — those are reused.\n`);
  }
}

let done = 0;
let bytesBefore = 0;
let bytesAfter = 0;
const failed = [];

const moved = await pooled(wanted, async (url) => {
  const key = blobKey(url);
  const already = uploaded.get(key);

  if (already && !force) {
    done += 1;
    return [url, already];
  }

  try {
    const packed = await repack(url);

    if (!packed) {
      failed.push(`${url} (not an image)`);
      return null;
    }

    const blob = await put(key, packed.webp, {
      access: "public",
      contentType: "image/webp",
      // The key is a hash of the source URL and has to stay exactly that, or a
      // re-run cannot tell what it has already done.
      addRandomSuffix: false,
      allowOverwrite: true,
      // These never change once written, so let browsers keep them.
      cacheControlMaxAge: 31536000,
    });

    bytesBefore += packed.original;
    bytesAfter += packed.webp.length;
    done += 1;

    if (done % 25 === 0) {
      console.log(`  ${done}/${wanted.length}`);
    }

    return [url, blob.url];
  } catch (error) {
    failed.push(`${url} (${error.message})`);
    return null;
  }
});

const urlMap = new Map(moved.filter(Boolean));

console.log(`\n${urlMap.size} photo(s) moved.`);

if (bytesBefore > 0) {
  console.log(
    `${(bytesBefore / 1024 / 1024).toFixed(1)} MB downloaded → ` +
      `${(bytesAfter / 1024 / 1024).toFixed(1)} MB stored ` +
      `(${(100 - (bytesAfter / bytesBefore) * 100).toFixed(0)}% smaller)`
  );
}

if (failed.length > 0) {
  console.log(`\n${failed.length} could not be moved:`);
  for (const line of failed.slice(0, 10)) console.log(`  ${line.slice(0, 100)}`);
  if (failed.length > 10) console.log(`  ...and ${failed.length - 10} more`);
}

if (urlMap.size === 0) {
  console.log("\nNothing to rewrite.");
  process.exit(failed.length > 0 ? 1 : 0);
}

if (!apply) {
  console.log("\nDry run — nothing was uploaded or rewritten.");
  console.log("Re-run with --apply to move the photos and repoint the shop at them.");
  process.exit(0);
}

/** Every supplier URL in a string swapped for its replacement. */
const repoint = (text) =>
  typeof text === "string" && urlMap.has(text)
    ? urlMap.get(text)
    : String(text ?? "").replace(
        /https:\/\/hhcnewapp\.[^\s"'<>]+/g,
        (url) => urlMap.get(url) ?? url
      );

writeFileSync(
  catalogPath,
  JSON.stringify(
    catalog.map((product) => ({
      ...product,
      image: repoint(product.image),
      ...(product.detailHtml
        ? { detailHtml: repoint(product.detailHtml) }
        : {}),
    })),
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

// Driven off the database rather than the catalog file, so products added by
// hand in the admin panel are repointed too.
const rows = await products
  .find({}, { projection: { image: 1, detailHtml: 1 } })
  .toArray();

const updates = [];

for (const row of rows) {
  const image = repoint(row.image);
  const detailHtml = row.detailHtml ? repoint(row.detailHtml) : row.detailHtml;

  if (image === row.image && detailHtml === row.detailHtml) continue;

  updates.push({
    updateOne: {
      filter: { _id: row._id },
      update: { $set: { image, detailHtml, updatedAt: new Date() } },
    },
  });
}

if (updates.length === 0) {
  console.log("Database: every product already points at the shop's own storage.");
} else {
  const result = await products.bulkWrite(updates);
  console.log(`Database: ${result.modifiedCount} product(s) repointed.`);
}

// What is still hotlinked, if anything — the number that matters, since one
// missed URL is one picture that can still vanish.
const stragglers = await products.countDocuments({
  $or: [
    { image: /hhcnewapp\./ },
    { detailHtml: /hhcnewapp\./ },
  ],
});

console.log(
  stragglers === 0
    ? "No product still points at the supplier's CDN."
    : `${stragglers} product(s) still point at the supplier's CDN.`
);

await mongoose.disconnect();
