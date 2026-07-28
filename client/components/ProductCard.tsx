"use client";

import Link from "next/link";
import { useWishlist } from "../context/WishlistContext";
import { formatPrice } from "../lib/currency";
import Stars from "./Stars";

type ProductProps = {
  id: string;
  name: string;
  price: number;
  image: string;
  rating?: number | null;
  reviewCount?: number;
  onAddToCart: () => void;
};

export default function ProductCard({
  id,
  name,
  price,
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
    <div className="card card-hover p-4 relative overflow-hidden">

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

      {/* Reserve the row either way so cards keep the same height. */}
      <div className="mt-2 h-6 flex items-center gap-2">
        {reviewCount > 0 && rating ? (
          <>
            <Stars rating={rating} />
            <span className="text-muted-soft text-sm">
              {rating.toFixed(1)} ({reviewCount})
            </span>
          </>
        ) : (
          <span className="text-muted-soft text-sm">No reviews yet</span>
        )}
      </div>

      <p className="price text-lg mt-1">{formatPrice(price)}</p>

      <button
        onClick={onAddToCart}
        className="btn btn-primary btn-block mt-4"
      >
        Add to Cart
      </button>

    </div>
  );
}
