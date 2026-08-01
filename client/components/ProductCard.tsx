"use client";

import Link from "next/link";
import { useWishlist } from "../context/WishlistContext";
import BagIcon from "./BagIcon";
import PriceTag from "./PriceTag";
import RatingScore from "./RatingScore";

type ProductProps = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  rating?: number | null;
  reviewCount?: number;
  onAddToCart: () => void;
};

export default function ProductCard({
  id,
  name,
  price,
  compareAtPrice,
  image,
  rating,
  reviewCount = 0,
  onAddToCart,
}: ProductProps) {
  const {
    wishlist,
    addToWishlist,
    removeFromWishlist,
  } = useWishlist();

  const isWishlisted = wishlist.some(
    (item) => item.id === id
  );

  return (
    // A column with the button pushed to the bottom, so a card with a rating
    // and one without still line their buttons up across a row. Reserving a
    // blank strip for the missing rating would do the same, but every card in
    // an unreviewed catalog would carry the gap.
    // Two of these sit side by side on a phone, so every fixed size here has a
    // smaller phone value: at 390px a card is about 173px wide, and the
    // desktop paddings alone would eat a fifth of that.
    <div className="card card-hover p-2.5 sm:p-4 relative overflow-hidden flex flex-col h-full">

      {/* Wishlist Button */}
      <button
        onClick={() => {
          if (isWishlisted) {
            removeFromWishlist(id);
          } else {
            addToWishlist({ id, name, price, image });
          }
        }}
        aria-label={
          isWishlisted ? "Remove from wishlist" : "Add to wishlist"
        }
        className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-10 text-sm sm:text-xl w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface/90 border border-border shadow flex items-center justify-center transition hover:scale-110"
      >
        {isWishlisted ? "❤️" : "🤍"}
      </button>

      <div className="overflow-hidden rounded-xl sm:rounded-2xl surface-muted">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="w-full h-32 sm:h-52 object-cover transition duration-500 hover:scale-105"
        />
      </div>

      <Link href={`/products/${id}`}>
        {/* Clamped on phones only. These names run to a dozen words — the
            supplier writes them as search bait — and at two per row an
            unclamped one takes five lines and pushes the button off the
            screen, which is the whole reason a card fits four to a screen or
            doesn't. */}
        <h3 className="mt-2 sm:mt-4 text-sm sm:text-xl font-bold leading-snug line-clamp-2 sm:line-clamp-none text-foreground hover:text-accent transition cursor-pointer">
          {name}
        </h3>
      </Link>

      <PriceTag price={price} compareAtPrice={compareAtPrice} className="mt-1.5 sm:mt-3" />

      {/* Renders nothing until the product has been reviewed. */}
      <RatingScore
        rating={rating}
        reviewCount={reviewCount}
        className="mt-1 sm:mt-2"
      />

      <div className="mt-auto pt-2.5 sm:pt-4">
        <button
          onClick={onAddToCart}
          className="btn btn-cart"
        >
          <BagIcon />
          Add to Cart
        </button>
      </div>

    </div>
  );
}
