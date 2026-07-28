"use client";

import Link from "next/link";
import { useWishlist } from "../context/WishlistContext";
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
    <div className="card card-hover p-4 relative overflow-hidden flex flex-col h-full">

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
        className="absolute top-5 right-5 z-10 text-xl w-10 h-10 rounded-full bg-surface/90 border border-border shadow flex items-center justify-center transition hover:scale-110"
      >
        {isWishlisted ? "❤️" : "🤍"}
      </button>

      <div className="overflow-hidden rounded-2xl surface-muted">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="w-full h-52 object-cover transition duration-500 hover:scale-105"
        />
      </div>

      <Link href={`/products/${id}`}>
        <h3 className="mt-4 text-xl font-bold text-foreground hover:text-primary transition cursor-pointer">
          {name}
        </h3>
      </Link>

      <PriceTag price={price} compareAtPrice={compareAtPrice} className="mt-3" />

      {/* Renders nothing until the product has been reviewed. */}
      <RatingScore
        rating={rating}
        reviewCount={reviewCount}
        className="mt-2"
      />

      <div className="mt-auto pt-4">
        <button
          onClick={onAddToCart}
          className="btn btn-primary btn-block"
        >
          Add to Cart
        </button>
      </div>

    </div>
  );
}
