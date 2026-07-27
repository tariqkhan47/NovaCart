"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import type { Order } from "../../types/order";
import { formatPrice } from "../../lib/currency";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    fetch("/api/orders")
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load your orders");
        return res.json();
      })
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  return (
    <main className="page p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          📦 My Orders
        </h1>

        {loading ? (
          <div className="panel p-8 text-center text-muted-soft text-xl">
            Loading...
          </div>
        ) : error ? (
          <div className="panel p-8 text-center text-danger text-xl">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="text-muted-soft text-xl mb-6">
              You haven&apos;t placed any orders yet.
            </p>

            <Link href="/">
              <button className="btn btn-primary btn-lg">
                Start Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="card p-6">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <h2 className="font-bold text-xl">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </h2>

                    <p className="text-muted-soft">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="price text-2xl">
                      {formatPrice(order.total)}
                    </p>

                    <span className="badge mt-2">{order.status}</span>
                  </div>
                </div>

                <div className="border-t divider pt-4">
                  {order.items.map((item, index) => (
                    <div
                      key={`${order._id}-${index}`}
                      className="flex justify-between py-2"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>

                      <span>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-muted-soft text-sm mt-4">
                  Delivering to: {order.customer.address}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
