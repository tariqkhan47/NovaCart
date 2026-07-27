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
    <main className="page py-10 px-6">
      <div className="max-w-6xl mx-auto panel p-8">

        <h1 className="text-4xl font-bold mb-8">
          ❤️ My Wishlist
        </h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-20">

            <h2 className="text-3xl font-bold mb-4">
              Your Wishlist is Empty
            </h2>

            <p className="text-muted-soft mb-8">
              Save your favourite products here.
            </p>

            <Link href="/">
              <button className="btn btn-primary btn-lg">
                Continue Shopping
              </button>
            </Link>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {wishlist.map((item) => (

              <div
                key={item.id}
                className="card card-hover p-5 flex gap-6"
              >

                <img
                  src={item.image}
                  alt={item.name}
                  className="w-40 h-40 rounded-2xl object-cover surface-muted"
                />

                <div className="flex-1">

                  <h2 className="text-2xl font-bold">
                    {item.name}
                  </h2>

                  <p className="price text-xl mt-3">
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
                      className="btn btn-primary btn-sm"
                    >
                      🛒 Add to Cart
                    </button>

                    <button
                      onClick={() =>
                        removeFromWishlist(item.id)
                      }
                      className="btn btn-danger btn-sm"
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