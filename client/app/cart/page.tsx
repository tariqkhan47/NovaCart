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
    <main className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-4xl font-bold mb-8">
          🛒 Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="border-b pb-6 mb-6">
            <h2 className="text-2xl font-semibold">
              Your cart is empty.
            </h2>

            <p className="text-gray-500 mt-2">
              Add some products to your cart.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-6 border-b pb-4"
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

                    <p className="text-blue-600 font-bold">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => decreaseQuantity(item.id)}
                      className="bg-gray-200 px-3 py-1 rounded-lg text-lg"
                    >
                      −
                    </button>

                    <span className="text-xl font-bold">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => increaseQuantity(item.id)}
                      className="bg-gray-200 px-3 py-1 rounded-lg text-lg"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
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

              <span className="text-3xl font-bold text-blue-600">
                ${total.toFixed(2)}
              </span>
            </div>

            <Link href="/checkout">
  <button className="mt-8 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
    Checkout
  </button>
</Link>
          </>
        )}
      </div>
    </main>
  );
}