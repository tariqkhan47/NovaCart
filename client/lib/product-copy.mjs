// Turning a supplier's product blurb into copy fit for a search result.
//
// Plain .mjs rather than .ts so the seeding scripts in scripts/ can import the
// same functions the site renders with — otherwise the descriptions written
// into the database and the ones generated on the fly would drift apart.

/** Cuts to `limit` characters on a word boundary, without dangling punctuation. */
export function truncate(text, limit) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;

  const cut = clean.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");

  return (
    cut.slice(0, lastSpace > 0 ? lastSpace : limit).replace(/[,;:—-]$/, "") + "…"
  );
}

/**
 * The product name minus the merchandising noise suppliers pack into it, so a
 * title reads "Aurora Galaxy Projector" rather than "Pack of 6 - ... (Multi
 * Color)". Everything dropped here is still on the page itself.
 */
export function shortName(name) {
  return (
    String(name ?? "")
      // Anything after a pipe or an en dash is a second, restated title.
      .split(/\s*[|–]\s*/)[0]
      // "(Random Color)", "(Pack of 6)" — variant notes, not the product.
      .replace(/\s*\([^)]*\)\s*$/, "")
      .replace(/\s*[-–]\s*$/, "")
      .trim() || String(name ?? "")
  );
}

/**
 * What the product is, in whole sentences.
 *
 * A third of the HHC catalog arrives clipped mid-word — "...enhancing the look
 * of your vanity, coffee table, bedside, o" — because the supplier caps the
 * field. Google will happily print that fragment as the snippet under the
 * shop's link, so anything without a closing full stop is dropped rather than
 * shown. Sentences are kept whole: no claim is shortened into a different one.
 *
 * Falls back to the product's own name when the blurb has no complete sentence
 * at all. That is thin, but it is accurate, which the fragment is not.
 */
export function productProse(product, limit = 110) {
  const raw = String(product?.description ?? "").replace(/\s+/g, " ").trim();

  // Split after ., ! or ? — the fragment the supplier cut has none, so it
  // lands in the final slot and gets filtered out below.
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(
      (sentence) =>
        /[.!?]$/.test(sentence) &&
        // "Features: 1." and "Size: M." end in a full stop but are list
        // headers, not descriptions. Four words is the shortest thing in this
        // catalog that actually says what a product is.
        sentence.split(/\s+/).length >= 4
    );

  let prose = "";

  for (const sentence of sentences) {
    if (prose && `${prose} ${sentence}`.length > limit) break;

    prose = prose ? `${prose} ${sentence}` : sentence;

    if (prose.length >= limit) break;
  }

  if (!prose) {
    const name = shortName(product?.name);
    prose = product?.category ? `${name} — ${product.category}.` : `${name}.`;
  }

  return truncate(prose, limit);
}
