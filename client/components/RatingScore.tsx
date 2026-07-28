import Stars from "./Stars";

type RatingScoreProps = {
  /** Average of the product's reviews, or null when it has none. */
  rating?: number | null;
  reviewCount?: number;
  size?: "sm" | "lg";
  className?: string;
};

/**
 * The stars, the score itself and how many reviews it came from.
 *
 * The number is spelled out beside the stars because "4.7" and "4.2" look
 * identical at card size, and the review count is next to it because a 5.0 off
 * one review is not the same claim as a 4.6 off ninety.
 *
 * A product with no reviews renders nothing at all — no stars, no placeholder.
 * Empty stars read as a bad score at a glance, and a default one would be a
 * rating no shopper gave it. Callers should not reserve space for this either:
 * see ProductCard, which keeps its cards aligned from the layout instead.
 */
export default function RatingScore({
  rating,
  reviewCount = 0,
  size = "sm",
  className = "",
}: RatingScoreProps) {
  const text = size === "lg" ? "text-base" : "text-sm";

  if (!rating || reviewCount === 0) return null;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Stars rating={rating} size={size === "lg" ? "1.25rem" : "1rem"} />

      <span className={`font-semibold text-foreground ${text}`}>
        {rating.toFixed(1)}
      </span>

      <span className={`text-muted-soft ${text}`}>
        ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
}
