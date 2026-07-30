/**
 * Settling a card order against what Safepay actually says happened.
 *
 * Both the shopper's return from the gateway and Safepay's own webhook end up
 * here, and neither is believed on its own: whichever arrives first, the
 * outcome is fetched from Safepay over the merchant secret and the order is
 * moved on that. The two entry points only differ in what wakes the shop up.
 */

import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { fetchPaymentOutcome, toPaisa } from "@/lib/safepay";

export type Settlement =
  | "paid"
  | "not-paid"
  | "unknown-tracker"
  | "amount-mismatch"
  | "unavailable";

export async function settleCardPayment(tracker: string): Promise<Settlement> {
  if (!tracker) return "unknown-tracker";

  await connectDB();

  const order = await Order.findOne({ paymentTracker: tracker });

  if (!order) {
    console.warn("SAFEPAY SETTLE: no order for tracker", { tracker });
    return "unknown-tracker";
  }

  // Already settled by whichever of the two got here first.
  if (order.paymentStatus === "paid") return "paid";

  const outcome = await fetchPaymentOutcome(tracker);

  if (!outcome) return "unavailable";

  if (!outcome.paid) {
    console.warn("SAFEPAY SETTLE: not paid", {
      tracker,
      state: outcome.state,
    });

    return "not-paid";
  }

  // Safepay was asked for this exact amount when the session was opened, so a
  // difference here means something is wrong on one side or the other. Paying
  // out goods against the wrong figure is worse than holding the order for
  // someone to look at, so it is left pending and shouted about.
  const expected = toPaisa(order.total);

  if (outcome.chargedPaisa !== null && outcome.chargedPaisa !== expected) {
    console.error("SAFEPAY SETTLE: amount mismatch", {
      tracker,
      orderId: String(order._id),
      expectedPaisa: expected,
      chargedPaisa: outcome.chargedPaisa,
    });

    return "amount-mismatch";
  }

  order.paymentStatus = "paid";
  await order.save();

  return "paid";
}
