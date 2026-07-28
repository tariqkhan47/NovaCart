"use client";

import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="page flex items-center justify-center px-4 sm:px-6">
      <div className="panel p-6 sm:p-10 text-center max-w-lg">
        <h1 className="text-5xl mb-4">✅</h1>

        <h2 className="text-3xl font-bold mb-4">
          Order Placed Successfully!
        </h2>

        <p className="text-muted-soft mb-8">
          Thank you for shopping with NovaCart.
          Your order has been received successfully.
        </p>

        <Link href="/">
          <button className="btn btn-primary btn-lg">
            Continue Shopping
          </button>
        </Link>
      </div>
    </main>
  );
}