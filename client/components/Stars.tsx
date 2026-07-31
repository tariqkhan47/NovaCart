type StarsProps = {
  rating: number;
  className?: string;
  /** Font size of the stars, e.g. "1.25rem". Defaults to the inherited size. */
  size?: string;
};

/**
 * Five stars filled to the exact rating.
 *
 * Two identical rows sit on top of each other — a dim one and a coloured one —
 * and the coloured one is clipped to rating/5 of the width. Rounding to whole
 * stars instead would show a 4.4 and a 3.6 as the same four stars, which is the
 * one thing the score beside it is there to tell apart.
 */
export default function Stars({ rating, className = "", size }: StarsProps) {
  // A rating out of range would overflow or invert the clip.
  const clamped = Math.min(Math.max(rating, 0), 5);
  const filled = `${(clamped / 5) * 100}%`;

  return (
    <span
      role="img"
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
      style={size ? { fontSize: size } : undefined}
      className={`relative inline-block whitespace-nowrap leading-none tracking-wide ${className}`}
    >
      {/* The empty row also sets the width both rows are measured against. */}
      <span aria-hidden="true" className="text-muted-soft opacity-30">
        ★★★★★
      </span>

      {/* Filled in the page's own ink rather than a gold of its own: near
          black on the light theme, near white on the dark one. The score and
          the review count sit right beside it in the same colour, so the
          whole rating reads as one object. */}
      <span
        aria-hidden="true"
        style={{ width: filled }}
        className="absolute left-0 top-0 overflow-hidden text-foreground"
      >
        ★★★★★
      </span>
    </span>
  );
}
