import mongoose, { Schema, models } from "mongoose";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/payments";

export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

// Prices are copied in at order time so the order total stays correct even if
// the product price changes later.
const OrderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "An order needs at least one item",
      },
    },

    // Copied in at order time, like the item prices above, so an old order
    // still adds up if the delivery rate changes later.
    deliveryCharge: { type: Number, required: true, default: 0 },

    // Items plus delivery — what the customer hands to the courier.
    total: { type: Number, required: true },

    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "cod",
    },

    // Separate from the order status below: an order can be paid for and not
    // yet shipped, or delivered and still unpaid, and the shop needs to be
    // able to say which. Orders placed before there was anything but Cash on
    // Delivery have neither field, which reads as "pending".
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
    },

    // What the customer quoted after transferring — an EasyPaisa TID or a bank
    // reference. The one thing that lets the owner find the money in the
    // account, so it is worth keeping even after the payment is confirmed.
    paymentReference: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Order = models.Order || mongoose.model("Order", OrderSchema);

export default Order;
