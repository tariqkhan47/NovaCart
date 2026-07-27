"use client";

import { useOrders, Order, OrderItem } from "../../context/OrderContext";

export default function OrdersPage() {
  const { orders, updateStatus } = useOrders();

  return (
    <main className="page p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          📦 Customer Orders
        </h1>

        {orders.length === 0 ? (
          <div className="panel p-8 text-center text-muted-soft text-xl">
            No Orders Found.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: Order) => (
              <div
                key={order.id}
                className="card p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="font-bold text-xl">
                      Order #{order.id}
                    </h2>

                    <p className="text-muted-soft">
                      {order.date}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="price text-2xl">
                      ${order.total.toFixed(2)}
                    </p>

                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateStatus(
                          order.id,
                          e.target.value as "Pending" | "Delivered"
                        )
                      }
                      className="field w-auto px-3 py-2 mt-2"
                    >
                      <option value="Pending">
                        Pending
                      </option>

                      <option value="Delivered">
                        Delivered
                      </option>
                    </select>
                  </div>
                </div>

                <div className="border-t divider pt-4">
                  {order.items.map((item: OrderItem) => (
                    <div
                      key={item.id}
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