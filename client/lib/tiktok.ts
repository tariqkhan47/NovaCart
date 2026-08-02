/**
 * TikTok Pixel — what tells TikTok which ad actually sold something.
 *
 * Without it an ad campaign can only optimise for clicks, which on TikTok
 * means it will happily spend a budget finding people who tap and leave. The
 * events below are what let it optimise for orders instead.
 *
 * Dormant until NEXT_PUBLIC_TIKTOK_PIXEL_ID is set. That is deliberate: the
 * id comes out of TikTok Ads Manager (Assets > Events > Web Events), and until
 * the shop has one there is nothing to send. With the variable unset,
 * TikTokPixel renders nothing and every track() call below is a no-op, so
 * this costs a visitor exactly zero bytes.
 *
 * NEXT_PUBLIC_ because the browser is what fires these; there is no secret
 * here. A pixel id is visible in the page source of every site that uses one.
 */

export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? "";

/**
 * TikTok's standard event names, limited to the ones this shop can honestly
 * report. Deliberately not CompletePayment: the shop takes Cash on Delivery
 * and bank transfer, so at the moment an order is placed no payment has been
 * completed, and telling TikTok otherwise would train it on a fiction.
 */
type TikTokEvent =
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "PlaceAnOrder";

/**
 * One product inside an event that covers several of them. An order-level
 * event has no single content_id to give, and TikTok rejects an event without
 * one ("Content ID is missing in your events"), so a cart or an order is
 * itemised here instead of being flattened into a bare total.
 */
type EventContent = {
  content_id: string;
  content_name?: string;
  quantity?: number;
  price?: number;
};

type EventProperties = {
  content_id?: string;
  content_name?: string;
  content_type?: "product";
  contents?: EventContent[];
  quantity?: number;
  price?: number;
  value?: number;
  currency?: "PKR";
};

declare global {
  interface Window {
    ttq?: {
      page: () => void;
      track: (event: string, properties?: Record<string, unknown>) => void;
      load: (id: string) => void;
      [key: string]: unknown;
    };
  }
}

/**
 * Reports one event, and never breaks the page doing it.
 *
 * Wrapped because this is called from the middle of real user actions — the
 * Add to Cart handler, the order that has just gone through — and a shop that
 * throws on a click because an ad network's script was blocked by an ad
 * blocker, or has not loaded yet, is a worse shop than one that silently does
 * not report.
 */
export function trackTikTok(event: TikTokEvent, properties?: EventProperties) {
  if (!TIKTOK_PIXEL_ID) return;

  try {
    window.ttq?.track(event, { currency: "PKR", ...properties });
  } catch {
    // Reporting is never worth an interrupted checkout.
  }
}
