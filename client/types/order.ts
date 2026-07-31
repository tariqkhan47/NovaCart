import type { PaymentMethod, PaymentStatus } from "../lib/payments";

export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  // Null when the product behind this line has since been deleted — the
  // snapshot fields below still carry everything the receipt needs.
  product: string | null;
  name: string;
  price: number;
  image?: string;
  quantity: number;
};

export type Order = {
  _id: string;
  items: OrderItem[];
  // Missing on orders placed before delivery charges existed.
  deliveryCharge?: number;
  total: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  paymentMethod: PaymentMethod;
  // Both missing on orders placed back when Cash on Delivery was the only
  // way to pay; treat an absent status as "pending".
  paymentStatus?: PaymentStatus;
  paymentReference?: string;
  // Card orders only — the gateway's id for the payment attempt.
  paymentTracker?: string;
  status: OrderStatus;
  createdAt: string;
};
