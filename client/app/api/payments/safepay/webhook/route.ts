import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@/lib/safepay";
import { settleCardPayment } from "@/lib/settle-payment";

/**
 * Safepay telling the shop that something happened to a card payment.
 *
 * This exists for the shopper who pays and then closes the tab: they never
 * come back through the return route, and an order left pending after the
 * money moved is the worse of the two failure modes.
 *
 * Nothing in the body is believed. It is read only far enough to learn which
 * tracker to ask about, and the answer comes from Safepay's own API over the
 * merchant secret. That is why a missing webhook secret cannot be used to
 * forge a payment here — the worst an unsigned POST can do is make the shop
 * ask Safepay a question it already knows the answer to.
 *
 * Register the URL under Developers > Webhooks in the Safepay dashboard.
 */
export async function POST(req: NextRequest) {
  let raw: string;

  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ message: "Unreadable body" }, { status: 400 });
  }

  let body: Record<string, unknown>;

  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ message: "Expected JSON" }, { status: 400 });
  }

  const data = (body.data ?? body) as Record<string, unknown>;

  // Safepay has moved this around between versions, so look in the places it
  // has used rather than insisting on one shape.
  const tracker = String(
    data.tracker ?? data.token ?? body.tracker ?? body.token ?? ""
  );

  if (!tracker) {
    console.warn("SAFEPAY WEBHOOK: no tracker in body", {
      bodyKeys: Object.keys(body),
      dataKeys: Object.keys(data),
    });

    return NextResponse.json({ message: "No tracker" }, { status: 400 });
  }

  // When a signature is sent and a secret is configured, a bad one is rejected
  // outright — no reason to go and ask about a message that is already known
  // to be junk. When either is absent the request still has to earn its
  // outcome from the API call below, so nothing is taken on trust.
  const signature = String(
    req.headers.get("x-sfpy-signature") ?? data.signature ?? body.signature ?? ""
  );

  if (signature && process.env.SAFEPAY_WEBHOOK_SECRET) {
    if (!verifySignature(tracker, signature)) {
      console.warn("SAFEPAY WEBHOOK: signature did not verify", { tracker });

      return NextResponse.json({ message: "Bad signature" }, { status: 401 });
    }
  }

  try {
    const settlement = await settleCardPayment(tracker);

    // Answered 200 even when the tracker is unknown or unpaid: neither is
    // something Safepay can fix by trying again, and a non-200 would have it
    // retrying for days.
    return NextResponse.json({ received: true, settlement });
  } catch (error) {
    console.error("SAFEPAY WEBHOOK ERROR:", error);

    // A 500 does ask Safepay to try again, which is what we want if the
    // database was briefly unreachable.
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
