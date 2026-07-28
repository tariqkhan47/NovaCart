"use client";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../lib/currency";
import { DELIVERY_CHARGE } from "../../lib/delivery";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const total = subtotal + DELIVERY_CHARGE;

  return (
    <main className="page py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto panel p-5 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8">
          🛒 Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="border-b divider pb-6 mb-6">
            <h2 className="text-2xl font-semibold">
              Your cart is empty.
            </h2>

            <p className="text-muted-soft mt-2">
              Add some products to your cart.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center gap-4 sm:gap-6 border-b divider pb-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg shrink-0"
                  />

                  {/* min-w-0 lets a long product name wrap instead of forcing
                      the row wider than the screen. */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-semibold break-words">
                      {item.name}
                    </h2>

                    <p className="price">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => decreaseQuantity(item.id)}
                      className="btn btn-outline btn-sm w-10 h-10 p-0 text-lg"
                    >
                      −
                    </button>

                    <span className="text-xl font-bold">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => increaseQuantity(item.id)}
                      className="btn btn-outline btn-sm w-10 h-10 p-0 text-lg"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex justify-between items-center gap-3">
                <span className="text-muted-soft">Subtotal</span>

                <span className="font-semibold">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex justify-between items-start gap-3">
                <span className="text-muted-soft">
                  Delivery
                  <span className="block text-sm">
                    Flat rate, all over Pakistan
                  </span>
                </span>

                <span className="font-semibold whitespace-nowrap">
                  {formatPrice(DELIVERY_CHARGE)}
                </span>
              </div>

              <div className="border-t divider pt-4 flex flex-wrap justify-between items-center gap-3">
                <h3 className="text-2xl font-bold">
                  Total:
                </h3>

                <span className="price text-2xl sm:text-3xl">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <Link href="/checkout">
              <button className="btn btn-primary btn-block btn-lg mt-8">
                Checkout
              </button>
            </Link>
          </>
        )}
      </div>
    </main>
  );
}