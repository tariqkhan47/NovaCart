/**
 * The drifting wall of product photos behind the hero copy.
 *
 * Two rows sliding in opposite directions, under a veil that is close to
 * opaque where the headline sits and thins out towards the edges — so the
 * shop's own stock is what fills the frame, without the "Welcome to Arsalah"
 * ever having to compete with a photo for contrast.
 *
 * Deliberately fed the *featured* products, which are the same photos the
 * "Featured Products" cards below load anyway. Reusing them means the strip
 * costs no extra bytes at all: by the time it is on screen the browser has
 * the files, or is about to fetch them for the cards regardless.
 *
 * Purely decorative — aria-hidden, and every tile has an empty alt. A screen
 * reader that announced twenty product names before reaching the headline
 * would be reading out the wallpaper.
 */
type HeroMarqueeProps = {
  images: string[];
};

// Enough tiles that one pass is wider than any viewport it has to cross;
// below this the row runs out mid-screen and the loop shows its seam.
const MIN_TILES = 10;

export default function HeroMarquee({ images }: HeroMarqueeProps) {
  if (images.length === 0) return null;

  // Repeated until the row is long enough, then the whole row is duplicated
  // once more. The animation travels exactly -50%, so it lands on the copy in
  // the same position the original started in and the loop never jumps.
  const filled: string[] = [];
  while (filled.length < MIN_TILES) filled.push(...images);

  const top = [...filled, ...filled];
  const bottom = [...filled].reverse();
  const bottomDoubled = [...bottom, ...bottom];

  return (
    <div className="hero-marquee" aria-hidden="true">
      <div className="hero-marquee-row">
        <div className="hero-marquee-track">
          {top.map((src, i) => (
            <span className="hero-tile" key={`t${i}`}>
              <img src={src} alt="" loading="eager" decoding="async" />
            </span>
          ))}
        </div>
      </div>

      <div className="hero-marquee-row">
        <div className="hero-marquee-track hero-marquee-track-reverse">
          {bottomDoubled.map((src, i) => (
            <span className="hero-tile" key={`b${i}`}>
              <img src={src} alt="" loading="eager" decoding="async" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
