import { formatPrice } from "../lib/currency";
import { discountPercent } from "../lib/seo";

type PriceTagProps = {
  price: number;
  /** What the product sold for before this price. Omit when it is not on offer. */
  compareAtPrice?: number | null;
  size?: "sm" | "lg";
  className?: string;
};

/**
 * What the shopper pays, with the old price struck through beside it.
 *
 * The crossed-out price only appears when it is above the current one, so a
 * stale or equal value quietly renders as a plain price rather than a "saving"
 * of nothing. See lib/seo.ts for what counts as a valid compare price.
 */
export default function PriceTag({
  price,
  compareAtPrice,
  size = "sm",
  className = "",
}: PriceTagProps) {
  const off = discountPercent(price, compareAtPrice);

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      <span className={`price ${size === "lg" ? "text-2xl sm:text-3xl" : "text-lg"}`}>
        {formatPrice(price)}
      </span>

      {off !== null && (
        <>
          <s
            className={`text-muted-soft ${size === "lg" ? "text-lg" : "text-sm"}`}
            // Screen readers announce a strikethrough as nothing at all, so the
            // old price would otherwise read as a second, contradictory price.
            aria-label={`Was ${formatPrice(compareAtPrice!)}`}
          >
            {formatPrice(compareAtPrice!)}
          </s>

          <span
            className={`rounded-full bg-success/15 px-2 py-0.5 font-semibold text-success ${
              size === "lg" ? "text-sm" : "text-xs"
            }`}
          >
            {off}% off
          </span>
        </>
      )}
    </span>
  );
}
