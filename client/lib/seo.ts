// Search-engine copy for a product, and the sums behind the crossed-out price.
//
// Both live here so the card, the product page and the seeding scripts all
// describe and price a product the same way.

import { formatPrice } from "./currency";
import { productProse, shortName, truncate } from "./product-copy.mjs";

export { shortName };

export const SITE_NAME = "NovaCart";

// Canonical URLs and structured data need absolute URLs, and Google ignores
// both if the host is wrong. Vercel sets VERCEL_PROJECT_PRODUCTION_URL on every
// deployment; the fallback is the shop's own domain.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://nova-cart-eosin.vercel.app")
).replace(/\/$/, "");

// Google truncates the snippet around 160 characters. Aim just under, so the
// last thing a shopper reads is a whole word rather than an ellipsis.
const MAX_DESCRIPTION = 155;

type SeoProduct = {
  name: string;
  price: number;
  category: string;
  description?: string;
  seoDescription?: string;
  stock?: number;
};

/**
 * The <title> for a product page. Ends with the shop name because that is what
 * a returning shopper scans a results page for.
 */
export function seoTitleFor(product: SeoProduct) {
  return truncate(
    `${shortName(product.name)} — ${product.category} | ${SITE_NAME}`,
    65
  );
}

/**
 * The meta description: what the product is, then what it costs and how to get
 * it — the two things someone scanning a results page decides on.
 *
 * The product half is the shop's own copy where it has been written
 * (seoDescription), and the supplier's blurb cleaned up where it has not. The
 * price half is always worked out here rather than stored, so a reprice or a
 * sell-out never leaves Google advertising a figure the page contradicts.
 *
 * Nothing in it is invented. A snippet that promises something the page does
 * not back up is what gets a shop marked down.
 */
export function seoDescriptionFor(product: SeoProduct) {
  const opening = product.seoDescription?.trim()
    ? truncate(product.seoDescription, 110)
    : productProse(product);

  const availability =
    product.stock === 0
      ? "Currently out of stock at NovaCart."
      : `Buy online at ${formatPrice(product.price)} with Cash on Delivery across Pakistan.`;

  return truncate(`${opening} ${availability}`, MAX_DESCRIPTION);
}

/**
 * The compare price to store, given what a form or an API caller sent.
 *
 * Returns undefined — which clears the field — for anything that is not a real
 * previous price: a blank box, a zero, junk, or a figure at or below what the
 * shopper pays. Every write goes through this, so the database cannot end up
 * with a crossed-out price that advertises a saving nobody makes.
 */
export function normalizeComparePrice(
  compareAtPrice: unknown,
  price: number
): number | undefined {
  if (compareAtPrice === "" || compareAtPrice == null) return undefined;

  const value = Number(compareAtPrice);

  if (!Number.isFinite(value) || !Number.isFinite(price)) return undefined;

  return value > price ? value : undefined;
}

/**
 * How much is off, as a whole percent — or null when there is nothing to claim.
 *
 * A compare price that is missing, not a number, or not above what the shopper
 * pays is not a discount, and the UI shows no crossed-out price at all rather
 * than a 0% one.
 */
export function discountPercent(
  price: number,
  compareAtPrice?: number | null
): number | null {
  if (
    typeof compareAtPrice !== "number" ||
    !Number.isFinite(compareAtPrice) ||
    !Number.isFinite(price) ||
    compareAtPrice <= price
  ) {
    return null;
  }

  const percent = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);

  // Rounding can land on 0 for a token cut; do not advertise "0% off".
  return percent > 0 ? percent : null;
}
