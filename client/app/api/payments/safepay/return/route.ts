import { NextRequest, NextResponse } from "next/server";
import { settleCardPayment } from "@/lib/settle-payment";

/**
 * Where Safepay sends the shopper back to once they have finished with the
 * card form.
 *
 * Safepay's redirect carries only an order id and a tracker, with nothing
 * signed, so none of it is taken as evidence. The tracker is used purely as a
 * question — "how did this one go?" — and the answer is fetched from Safepay
 * over the merchant secret, which the browser has never seen.
 *
 * Landing here is not proof of payment either way: a shopper can close the tab
 * before being redirected. That is what the webhook is for. This route only
 * makes the common case feel immediate.
 */
async function handle(req: NextRequest) {
  const tracker = req.nextUrl.searchParams.get("tracker") ?? "";

  const success = new URL("/success", req.nextUrl.origin);
  success.searchParams.set("payment", "card");

  let settlement;

  try {
    settlement = await settleCardPayment(tracker);
  } catch (error) {
    console.error("SAFEPAY RETURN ERROR:", error);
    settlement = "unavailable" as const;
  }

  // Anything short of a confirmed payment tells the shopper it is still being
  // checked rather than claiming money arrived that might not have.
  success.searchParams.set(
    "status",
    settlement === "paid" ? "paid" : "pending"
  );

  return NextResponse.redirect(success);
}

// Safepay has used both over time, and a redirect that 405s would strand a
// shopper who has already been charged.
export const GET = handle;
export const POST = handle;
