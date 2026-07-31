/**
 * The Arsalah mark: a paper plane, split along its fold.
 *
 * The name is the Arabic أرسلَ — to send, to dispatch — so the mark is the
 * act rather than the shop: something on its way, tilted 12° off vertical so
 * it reads as in flight rather than parked. No letterform and no wordmark, so
 * it says the same thing next to the name in the header as it does alone in a
 * browser tab.
 *
 * Two subpaths, filled with `currentColor` and no strokes, which is what lets
 * it take the header's ink in both themes — the old cart-and-scales device was
 * a near-black PNG and had to be painted through a CSS mask to survive the
 * dark theme.
 *
 * It carries width and height attributes and is sized by `svg.brand-mark` in
 * globals.css rather than by height utilities alone. Both matter: without an
 * intrinsic size an SVG can collapse to zero width in a flex row, and a
 * zero-width SVG paints nothing while still holding its place — an empty gap
 * next to the name, which is exactly what it looked like.
 *
 * The same path draws app/icon.png, apple-icon.png and favicon.ico: near-black
 * #16171a on a lime #d6f24b tile, corners at 22% of the tile, the mark 56% of
 * the tile's height and pushed to 70% at 16px, where the wings otherwise
 * thin out to nothing. Regenerate them from here if the shape ever changes.
 */
export default function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 76.296 90.606"
      width="76.296"
      height="90.606"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M54.047,0 L40.949,61.623 L0,74.389 Z M57.177,0.665 L76.296,90.606 L44.079,62.289 Z"
      />
    </svg>
  );
}
