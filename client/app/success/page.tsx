"use client";

import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-xl p-10 text-center max-w-lg">
        <h1 className="text-5xl mb-4">✅</h1>

        <h2 className="text-3xl font-bold mb-4">
          Order Placed Successfully!
        </h2>

        <p className="text-gray-600 mb-8">
          Thank you for shopping with NovaCart.
          Your order has been received successfully.
        </p>

        <Link href="/">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700">
            Continue Shopping
          </button>
        </Link>
      </div>
    </main>
  );
}