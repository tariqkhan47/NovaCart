"use client";

import { useCallback, useEffect, useState } from "react";
import { ORDER_STATUSES, type Order, type OrderStatus } from "../../../types/order";
import { formatPrice } from "../../../lib/currency";
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUSES,
  paymentMethodLabel,
  type PaymentStatus,
} from "../../../lib/payments";

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

  async function updateOrder(
    id: string,
    patch: { status?: OrderStatus; paymentStatus?: PaymentStatus }
  ) {
    const previous = orders;

    // Optimistic, rolled back if the server disagrees.
    setOrders((prev) =>
      prev.map((order) =>
        order._id === id ? { ...order, ...patch } : order
      )
    );

    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
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
    <main className="page p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <span className="eyebrow">Arsalah Admin</span>
            <h1 className="text-3xl sm:text-4xl font-bold mt-2">
              📋 Customer Orders
            </h1>
          </div>

          <div className="sm:text-right">
            <p className="text-muted-soft text-sm">Revenue (excl. cancelled)</p>
            <p className="price text-2xl sm:text-3xl">{formatPrice(revenue)}</p>
          </div>
        </div>

        {error && (
          <div className="card p-4 mb-6 text-danger">{error}</div>
        )}

        {loading ? (
          <div className="panel p-5 sm:p-8 text-center text-muted-soft text-xl">
            Loading...
          </div>
        ) : orders.length === 0 ? (
          <div className="panel p-5 sm:p-8 text-center text-muted-soft text-xl">
            No orders yet.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="card p-4 sm:p-6">

                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h2 className="font-bold text-xl">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </h2>

                    <p className="text-muted-soft">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>

                    <p className="mt-3 font-semibold">
                      {order.customer.name}
                    </p>
                    <p className="text-muted-soft text-sm break-words">
                      {order.customer.phone} · {order.customer.email}
                    </p>
                    <p className="text-muted-soft text-sm max-w-md break-words">
                      {order.customer.address}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="price text-2xl">
                      {formatPrice(order.total)}
                    </p>

                    <p className="text-muted-soft text-sm mt-1">
                      {paymentMethodLabel(order.paymentMethod)}
                    </p>

                    {/* What the customer says they sent, so it can be matched
                        against the account statement before the payment is
                        marked as arrived. */}
                    {order.paymentReference && (
                      <p className="text-muted-soft text-sm break-all">
                        Ref: {order.paymentReference}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3 sm:justify-end">
                      <select
                        value={order.paymentStatus ?? "pending"}
                        onChange={(e) =>
                          updateOrder(order._id, {
                            paymentStatus: e.target.value as PaymentStatus,
                          })
                        }
                        className="field w-auto px-3 py-2"
                      >
                        {PAYMENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {PAYMENT_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>

                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateOrder(order._id, {
                            status: e.target.value as OrderStatus,
                          })
                        }
                        className="field w-auto px-3 py-2"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t divider pt-4 mt-4">
                  {order.items.map((item, index) => (
                    <div
                      key={`${order._id}-${index}`}
                      className="flex justify-between gap-3 py-2"
                    >
                      <span className="min-w-0 break-words">
                        {item.name} × {item.quantity}
                      </span>

                      <span className="whitespace-nowrap">
                        {formatPrice(item.price * item.quantity)}
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
