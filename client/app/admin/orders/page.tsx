"use client";

import { useCart } from "../../../context/CartContext";

export default function OrdersPage() {
  const { cart } = useCart();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-4xl font-bold mb-8">
          📋 Orders
        </h1>

        {cart.length === 0 ? (
          <div className="text-center text-gray-500 text-xl">
            No Orders Yet
          </div>
        ) : (
          <>
            <div className="space-y-5">

              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border rounded-lg p-5"
                >
                  <div>
                    <h2 className="font-bold text-xl">
                      {item.name}
                    </h2>

                    <p>
                      Price: ${item.price}
                    </p>

                    <p>
                      Quantity: {item.quantity}
                    </p>
                  </div>

                  <div className="text-xl font-bold text-blue-600">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}

            </div>

            <div className="mt-10 text-right">
              <h2 className="text-3xl font-bold">
                Total Revenue: ${total.toFixed(2)}
              </h2>
            </div>
          </>
        )}

      </div>
    </main>
  );
}