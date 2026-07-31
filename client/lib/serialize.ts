// Shapes Prisma's plain rows (int ids, Decimal instances) back into the JSON
// shape the frontend already expects from the old Mongoose responses (string
// `_id`, plain numbers) — see the "keep the JSON contract" note in the
// migration plan. Keeping this in one place instead of every route avoids
// each call site reinventing the same id/Decimal conversions.
import type { Order, OrderItem, Product, Review, Subscriber } from "@prisma/client";

type Decimalish = { toString(): string };

function num(value: Decimalish | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  return typeof value === "number" ? value : Number(value.toString());
}

export function serializeProduct(
  product: Product & { rating?: number | null; reviewCount?: number }
) {
  return {
    ...product,
    _id: String(product.id),
    price: num(product.price),
    compareAtPrice: num(product.compareAtPrice),
    rating: product.rating ?? null,
    reviewCount: product.reviewCount ?? 0,
  };
}

export function serializeOrder(order: Order & { items: OrderItem[] }) {
  return {
    ...order,
    _id: String(order.id),
    user: String(order.userId),
    deliveryCharge: num(order.deliveryCharge),
    total: num(order.total),
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: order.customerAddress,
    },
    items: order.items.map((item) => ({
      _id: String(item.id),
      product: item.productId !== null ? String(item.productId) : null,
      name: item.name,
      price: num(item.price),
      image: item.image ?? undefined,
      quantity: item.quantity,
    })),
  };
}

export function serializeReview(
  review: Review & { product?: { name: string; image: string } | null }
) {
  const { product, ...rest } = review;

  return {
    ...rest,
    _id: String(review.id),
    product: product
      ? { _id: String(review.productId), name: product.name, image: product.image }
      : String(review.productId),
    user: String(review.userId),
  };
}

export function serializeSubscriber(subscriber: Subscriber) {
  return { ...subscriber, _id: String(subscriber.id) };
}
