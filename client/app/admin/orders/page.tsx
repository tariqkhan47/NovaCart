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
import ShippingLabel from "../../../components/ShippingLabel";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // The one order currently on its way to the printer. Only ever one at a
  // time: the print stylesheet lifts the label to the top-left of the sheet,
  // so two of them rendered at once would sit on top of each other.
  const [printing, setPrinting] = useState<Order | null>(null);

  useEffect(() => {
    if (!printing) return;

    // A frame first, or the dialog opens over a label React has not painted
    // yet and the sheet comes out blank.
    const frame = requestAnimationFrame(() => window.print());

    // Cleared on afterprint rather than straight after print() returns:
    // Safari and Firefox return immediately and keep rendering in the
    // background, and tearing the label down under them prints nothing.
    const done = () => setPrinting(null);
    window.addEventListener("afterprint", done);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

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

  /**
   * Throws an order away for good — a test, a duplicate, someone who filled
   * the form in twice.
   *
   * Confirmed first because there is no undo, and the prompt names the
   * customer and the total rather than saying "are you sure": the rows all
   * look alike at a glance, and the one thing worth checking is that this is
   * the row you meant.
   */
  async function deleteOrder(id: string, customerName: string, total: number) {
    const ok = window.confirm(
      `Delete order #${id} from ${customerName} for ${formatPrice(total)}?\n\n` +
        `This cannot be undone. Any stock it is holding goes back to the shelf.`
    );

    if (!ok) return;

    const previous = orders;
    setOrders((prev) => prev.filter((order) => order._id !== id));

    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });

    if (!res.ok) {
      setOrders(previous);
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Could not delete the order");
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

                      <button
                        onClick={() => setPrinting(order)}
                        title="Print the shipping label for this order"
                        className="btn btn-sm btn-outline px-3 py-2"
                      >
                        🖨 Label
                      </button>

                      {/* Last, and the only control here that is not a
                          dropdown, so it cannot be hit while reaching for
                          one. Danger colouring rather than a red fill: it
                          sits beside two neutral selects and a red block
                          would read as the primary action on the row. */}
                      <button
                        onClick={() =>
                          deleteOrder(order._id, order.customer.name, order.total)
                        }
                        title="Delete this order"
                        aria-label={`Delete order ${order._id}`}
                        className="btn btn-sm border border-danger/40 text-danger hover:bg-danger/10 px-3 py-2"
                      >
                        🗑 Delete
                      </button>
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

      {/* Outside the dashboard's own wrapper so the print stylesheet can lift
          it to the corner of the sheet without dragging a max-width and a
          page padding along with it. */}
      <ShippingLabel order={printing} />
    </main>
  );
}
