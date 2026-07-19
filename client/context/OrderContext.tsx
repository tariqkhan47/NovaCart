"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type OrderItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export type Order = {
  id: number;
  items: OrderItem[];
  total: number;
  date: string;
  status: "Pending" | "Delivered";
};

type OrderContextType = {
  orders: Order[];
  placeOrder: (items: OrderItem[], total: number) => void;
  updateStatus: (id: number, status: "Pending" | "Delivered") => void;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("novacart-orders");

    if (saved) {
      setOrders(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "novacart-orders",
      JSON.stringify(orders)
    );
  }, [orders]);

  function placeOrder(items: OrderItem[], total: number) {
    const newOrder: Order = {
      id: Date.now(),
      items,
      total,
      date: new Date().toLocaleString(),
      status: "Pending",
    };

    setOrders((prev) => [newOrder, ...prev]);
  }

  function updateStatus(
    id: number,
    status: "Pending" | "Delivered"
  ) {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? { ...order, status }
          : order
      )
    );
  }

  return (
    <OrderContext.Provider
      value={{
        orders,
        placeOrder,
        updateStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error(
      "useOrders must be used inside OrderProvider"
    );
  }

  return context;
}