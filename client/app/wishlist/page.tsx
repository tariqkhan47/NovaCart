"use client";

import Link from "next/link";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";

export default function WishlistPage() {
  const {
    wishlist,
    removeFromWishlist,
  } = useWishlist();

  const { addToCart } = useCart();

  return (
    <main className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-8">

        <h1 className="text-4xl font-bold mb-8">
          ❤️ My Wishlist
        </h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-20">

            <h2 className="text-3xl font-bold mb-4">
              Your Wishlist is Empty
            </h2>

            <p className="text-gray-500 mb-8">
              Save your favourite products here.
            </p>

            <Link href="/">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700">
                Continue Shopping
              </button>
            </Link>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {wishlist.map((item) => (

              <div
                key={item.id}
                className="bg-gray-50 rounded-xl shadow p-5 flex gap-6"
              >

                <img
                  src={item.image}
                  alt={item.name}
                  className="w-40 h-40 rounded-lg object-cover"
                />

                <div className="flex-1">

                  <h2 className="text-2xl font-bold">
                    {item.name}
                  </h2>

                  <p className="text-blue-600 text-xl font-bold mt-3">
                    ${item.price.toFixed(2)}
                  </p>

                  <div className="flex gap-3 mt-8">

                    <button
                      onClick={() =>
                        addToCart({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          image: item.image,
                        })
                      }
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                    >
                      🛒 Add to Cart
                    </button>

                    <button
                      onClick={() =>
                        removeFromWishlist(item.id)
                      }
                      className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700"
                    >
                      Remove
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>
    </main>
  );
}