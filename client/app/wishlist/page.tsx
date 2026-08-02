"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import BagIcon from "../../components/BagIcon";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../lib/currency";

export default function WishlistPage() {
  const {
    wishlist,
    removeFromWishlist,
  } = useWishlist();

  const { addToCart } = useCart();
  const router = useRouter();

  // Adds and goes, in that order — checkout reads the cart, so pushing first
  // would arrive at an empty one. The item stays on the wishlist; nothing
  // here says it has been bought, only that it is on its way to checkout.
  const buyNow = (item: {
    id: string;
    name: string;
    price: number;
    image: string;
  }) => {
    addToCart(item);
    router.push("/checkout");
  };

  return (
    <main className="page py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto panel p-5 sm:p-8">

        <h1 className="text-3xl sm:text-4xl font-bold mb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

            {wishlist.map((item) => (

              <div
                key={item.id}
                className="card card-hover p-4 sm:p-5 flex gap-4 sm:gap-6"
              >

                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="w-24 h-24 sm:w-40 sm:h-40 shrink-0 rounded-2xl object-cover surface-muted"
                />

                {/* min-w-0 so a long name wraps rather than widening the card. */}
                <div className="flex-1 min-w-0">

                  <h2 className="text-lg sm:text-2xl font-bold break-words">
                    {item.name}
                  </h2>

                  <p className="price text-lg sm:text-xl mt-2 sm:mt-3">
                    {formatPrice(item.price)}
                  </p>

                  <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-8">

                    <button
                      onClick={() =>
                        addToCart({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          image: item.image,
                        })
                      }
                      className="btn btn-cart btn-sm"
                    >
                      <BagIcon />
                      Add to Cart
                    </button>

                    <button
                      onClick={() => buyNow(item)}
                      className="btn btn-buy btn-sm"
                    >
                      Buy Now
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