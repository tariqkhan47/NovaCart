"use client";

import { useCallback, useEffect, useState } from "react";
import { ORDER_STATUSES, type Order, type OrderStatus } from "../../../types/order";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");

      if (!res.ok) throw new Error("Could not load orders");

      setOrders(await res.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: OrderStatus) {
    const previous = orders;

    // Optimistic, rolled back if the server disagrees.
    setOrders((prev) =>
      prev.map((order) =>
        order._id === id ? { ...order, status } : order
      )
    );

    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      setOrders(previous);
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Could not update the order");
    }
  }

  const revenue = orders
    .filter((order) => order.status !== "Cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <main className="page p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <span className="eyebrow">NovaCart Admin</span>
            <h1 className="text-4xl font-bold mt-2">
              📋 Customer Orders
            </h1>
          </div>

          <div className="text-right">
            <p className="text-muted-soft text-sm">Revenue (excl. cancelled)</p>
            <p className="price text-3xl">${revenue.toFixed(2)}</p>
          </div>
        </div>

        {error && (
          <div className="card p-4 mb-6 text-danger">{error}</div>
        )}

        {loading ? (
          <div className="panel p-8 text-center text-muted-soft text-xl">
            Loading...
          </div>
        ) : orders.length === 0 ? (
          <div className="panel p-8 text-center text-muted-soft text-xl">
            No orders yet.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="card p-6">

                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <h2 className="font-bold text-xl">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </h2>

                    <p className="text-muted-soft">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>

                    <p className="mt-3 font-semibold">
                      {order.customer.name}
                    </p>
                    <p className="text-muted-soft text-sm">
                      {order.customer.phone} · {order.customer.email}
                    </p>
                    <p className="text-muted-soft text-sm max-w-md">
                      {order.customer.address}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="price text-2xl">
                      ${order.total.toFixed(2)}
                    </p>

                    <p className="text-muted-soft text-sm mt-1">
                      Cash on Delivery
                    </p>

                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateStatus(
                          order._id,
                          e.target.value as OrderStatus
                        )
                      }
                      className="field w-auto px-3 py-2 mt-3"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t divider pt-4 mt-4">
                  {order.items.map((item, index) => (
                    <div
                      key={`${order._id}-${index}`}
                      className="flex justify-between py-2"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>

                      <span>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
