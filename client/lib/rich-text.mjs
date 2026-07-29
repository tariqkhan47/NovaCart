// Making a supplier's HTML description safe to put on the page.
//
// HHC's long description is authored HTML — paragraphs, feature lists and the
// photos that go with them. It is written by other people on someone else's
// portal, so it is untrusted input: dropped into the page as-is it would be a
// stored XSS hole across the whole catalog.
//
// Plain .mjs rather than .ts for the same reason as product-copy.mjs: the
// import scripts in scripts/ and the site itself have to clean HTML the same
// way, and the script side cannot import TypeScript.

// Everything a product description legitimately needs, and nothing that can
// run, fetch or navigate. <a> is deliberately absent — the supplier's copy
// links back to their own portal, which is not somewhere this shop sends
// customers, so those become plain text.
const ALLOWED_TAGS = new Set([
  "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s", "sub", "sup",
  "ul", "ol", "li",
  "h2", "h3", "h4", "h5", "h6",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th",
  "img", "figure", "figcaption",
  "div", "span",
]);

// Elements with no closing tag, which have to be emitted self-closed.
const VOID_TAGS = new Set(["br", "hr", "img"]);

// WordPress media shortcodes, which are not markup and so survive tag
// stripping untouched — the supplier's copy carries things like
// [video width="1280" mp4="https://.../clip.mp4"][/video], and left in they
// print on the product page as that literal text.
//
// Only the media ones are listed. A blanket [..] strip would eat "[Pack of 2]"
// and the rest of the bracketed notes suppliers put in real sentences.
const SHORTCODES =
  /\[(video|audio|embed|playlist|gallery|caption|vc_[a-z_]+)\b[^\]]*\](?:[\s\S]*?\[\/\1\])?/gi;

// Tags whose *contents* have to go too. Stripping just the <script> leaves the
// code behind as text, which is fine in a paragraph but not once a later edit
// puts it back inside markup.
const STRIP_WITH_CONTENT = /<(script|style|noscript|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

/** The src of an <img>, if it is one this site is willing to load. */
function imageSource(attributes) {
  const match =
    attributes.match(/\ssrc\s*=\s*"([^"]*)"/i) ||
    attributes.match(/\ssrc\s*=\s*'([^']*)'/i) ||
    attributes.match(/\ssrc\s*=\s*([^\s>]+)/i);

  const src = match?.[1]?.trim();

  // https only: no data: (a payload dressed as a picture), no javascript:, and
  // no http, which would break the padlock on every product page.
  return src && /^https:\/\/[^\s"'<>]+$/i.test(src) ? src : null;
}

/** The alt text of an <img>, with anything that could close the tag removed. */
function imageAlt(attributes) {
  const match =
    attributes.match(/\salt\s*=\s*"([^"]*)"/i) ||
    attributes.match(/\salt\s*=\s*'([^']*)'/i);

  return (match?.[1] ?? "").replace(/[<>"]/g, "").trim();
}

/**
 * The same HTML with everything unsafe taken out.
 *
 * Works by allowlist in both directions: a tag not in ALLOWED_TAGS is dropped
 * (its text is kept), and *every* attribute is dropped except src and alt on an
 * <img>. That covers the whole on*= family, style, srcset, formaction and
 * whatever else gets invented, because nothing is carried over unless it is
 * named here.
 */
export function sanitizeHtml(html) {
  return String(html ?? "")
    .replace(STRIP_WITH_CONTENT, "")
    .replace(SHORTCODES, "")
    // Comments can hide markup that some parsers still act on.
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (whole, rawTag, attributes) => {
      const tag = rawTag.toLowerCase();

      if (!ALLOWED_TAGS.has(tag)) return "";

      if (whole.startsWith("</")) return `</${tag}>`;

      if (tag === "img") {
        const src = imageSource(attributes);
        if (!src) return "";

        const alt = imageAlt(attributes);
        return `<img src="${src}" alt="${alt}" loading="lazy" />`;
      }

      // Void elements are always written closed. Suppliers author them both
      // ways, and normalising here is what lets the tidy-up below recognise a
      // run of blank lines whichever way it was typed.
      return VOID_TAGS.has(tag) ? `<${tag} />` : `<${tag}>`;
    })
    // Empty wrappers and stray whitespace runs left behind by the strip. The
    // editors this copy is written in leave a lot of these behind — Quill marks
    // every list item with an empty <span> that only its own stylesheet uses.
    .replace(/<span>\s*<\/span>/gi, "")
    .replace(/<p>\s*(<br \/>\s*)*<\/p>/gi, "")
    .replace(/(\s*<br \/>\s*){3,}/gi, "<br /><br />")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * The same text with any WordPress media shortcodes taken out.
 *
 * Exposed separately from sanitizeHtml for the plain-text fields — the short
 * description beside the price is not HTML, and running the tag stripper over
 * it would quietly eat anything a supplier wrote in angle brackets.
 */
export function stripShortcodes(text) {
  return String(text ?? "")
    .replace(SHORTCODES, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The visible words, with the markup gone — for length checks and previews. */
export function htmlToText(html) {
  return String(html ?? "")
    .replace(STRIP_WITH_CONTENT, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every image the description shows, in the order it shows them. */
export function imagesIn(html) {
  return [...String(html ?? "").matchAll(/<img\b[^>]*>/gi)]
    .map((match) => imageSource(match[0]))
    .filter(Boolean);
}

/**
 * The long description to store, given whatever a form or an API caller sent.
 *
 * Cleaning happens on the way in rather than on the way out so that nothing can
 * reach the database dirty — a later reader that forgets to sanitize then has
 * nothing to leak.
 *
 * The two empty answers mean different things, and Mongoose treats them
 * differently on an update, which is what makes the distinction worth keeping:
 * `undefined` for a caller that did not mention the field leaves whatever is
 * stored alone, while `null` for an emptied box clears it. Without that, an
 * admin could never delete a supplier write-up they did not want.
 */
export function normalizeDetailHtml(value) {
  if (typeof value !== "string") return undefined;

  return sanitizeHtml(value) || null;
}

/**
 * Whether a cleaned description is worth storing.
 *
 * A description that survives sanitizing as two words and no pictures is worse
 * than the short blurb the product already has, so the import leaves those
 * alone rather than overwriting good copy with an empty box.
 */
export function isWorthKeeping(html) {
  return htmlToText(html).length >= 80 || imagesIn(html).length > 0;
}
