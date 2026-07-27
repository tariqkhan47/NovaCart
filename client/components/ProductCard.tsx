"use client";

import Link from "next/link";
import { useWishlist } from "../context/WishlistContext";

type ProductProps = {
  id: string;
  name: string;
  price: string;
  image: string;
  onAddToCart: () => void;
};

export default function ProductCard({
  id,
  name,
  price,
  image,
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
            addToWishlist({
              id,
              name,
              price: Number(price.replace("$", "")),
              image,
            });
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
          className="w-full h-52 object-cover transition duration-500 hover:scale-105"
        />
      </div>

      <Link href={`/products/${id}`}>
        <h3 className="mt-4 text-xl font-bold text-foreground hover:text-primary transition cursor-pointer">
          {name}
        </h3>
      </Link>

      <p className="price text-lg mt-2">{price}</p>

      <button
        onClick={onAddToCart}
        className="btn btn-primary btn-block mt-4"
      >
        Add to Cart
      </button>

    </div>
  );
}
