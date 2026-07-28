import mongoose, { Schema, models } from "mongoose";

/**
 * The shop's mailing list.
 *
 * Placing an order signs the customer up automatically — see the order route.
 * One row per email address, so a repeat customer is counted once and their
 * details stay current.
 */
const SubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    name: { type: String, trim: true },
    phone: { type: String, trim: true },

    // How they joined the list. Only orders sign people up today.
    source: {
      type: String,
      enum: ["order", "manual"],
      default: "order",
    },

    // Orders placed with this email — the list doubles as a repeat-customer
    // count without having to scan the orders collection.
    orderCount: { type: Number, default: 0 },

    // Cleared when someone asks to be taken off the list. Nothing sets this
    // to false yet; it is here so removing a subscriber does not mean losing
    // the record and re-adding them on their next order.
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Subscriber =
  models.Subscriber || mongoose.model("Subscriber", SubscriberSchema);

export default Subscriber;
