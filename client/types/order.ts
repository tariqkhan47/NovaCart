export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  product: string;
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
  paymentMethod: "cod";
  status: OrderStatus;
  createdAt: string;
};
