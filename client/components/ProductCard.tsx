"use client";

import Link from "next/link";
import { useWishlist } from "../context/WishlistContext";

type ProductProps = {
  id: number;
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
    <div className="bg-white rounded-xl shadow-lg p-4 relative hover:shadow-2xl transition">

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
        className="absolute top-3 right-3 text-2xl"
      >
        {isWishlisted ? "❤️" : "🤍"}
      </button>

      <img
        src={image}
        alt={name}
        className="w-full h-52 object-cover rounded-lg"
      />

      <Link href={`/products/${id}`}>
        <h3 className="mt-4 text-xl font-bold hover:text-blue-600 cursor-pointer">
          {name}
        </h3>
      </Link>

      <p className="text-gray-600 mt-2">{price}</p>

      <button
        onClick={onAddToCart}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        Add to Cart
      </button>

    </div>
  );
}