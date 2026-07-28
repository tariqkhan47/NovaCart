import { randomBytes } from "node:crypto";
import mongoose, { Schema, models } from "mongoose";

/** Secret that stands in for the email address in an unsubscribe link. */
export function newUnsubscribeToken() {
  return randomBytes(16).toString("hex");
}

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

    // How they joined the list: by ordering, by using the footer signup box,
    // or added by hand.
    source: {
      type: String,
      enum: ["order", "newsletter", "manual"],
      default: "order",
    },

    // Orders placed with this email — the list doubles as a repeat-customer
    // count without having to scan the orders collection.
    orderCount: { type: Number, default: 0 },

    // Cleared when someone unsubscribes. The row stays behind so a later
    // order does not quietly put them back on the list.
    active: { type: Boolean, default: true },

    // What an unsubscribe link carries instead of the email address, so the
    // link cannot be used to guess at or remove somebody else's address.
    unsubscribeToken: {
      type: String,
      required: true,
      unique: true,
      default: newUnsubscribeToken,
    },
  },
  { timestamps: true }
);

const Subscriber =
  models.Subscriber || mongoose.model("Subscriber", SubscriberSchema);

export default Subscriber;
