"use client";
import Link from "next/link";
import { useCart } from "../../context/CartContext";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main className="page py-10 px-6">
      <div className="max-w-5xl mx-auto panel p-8">
        <h1 className="text-4xl font-bold mb-8">
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
                  className="flex items-center gap-6 border-b divider pb-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />

                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">
                      {item.name}
                    </h2>

                    <p className="price">
                      ${item.price.toFixed(2)}
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

            <div className="flex justify-between items-center mt-8">
              <h3 className="text-2xl font-bold">
                Total:
              </h3>

              <span className="price text-3xl">
                ${total.toFixed(2)}
              </span>
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