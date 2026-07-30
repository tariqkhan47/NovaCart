/**
 * Talking to Safepay, the gateway that takes card payments.
 *
 * Card numbers never reach this site. We ask Safepay to open a payment
 * session, send the shopper to Safepay's own page to type their card in, and
 * are told the outcome afterwards. That is what keeps the shop out of PCI
 * scope, and it is the only reason the card option can exist at all.
 *
 * Server-only. The secret key must never be bundled into a page, so nothing
 * here may be imported from a "use client" component — lib/payments.ts is the
 * side of the wall the checkout screen is allowed to see.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const HOSTS = {
  sandbox: {
    api: "https://sandbox.api.getsafepay.com",
    checkout: "https://sandbox.api.getsafepay.com/embedded/",
  },
  production: {
    api: "https://api.getsafepay.com",
    checkout: "https://getsafepay.com/embedded/",
  },
} as const;

type Environment = keyof typeof HOSTS;

function environment(): Environment {
  return process.env.SAFEPAY_ENVIRONMENT === "production"
    ? "production"
    : "sandbox";
}

/**
 * The three values from the Safepay dashboard.
 *
 * Read through a function rather than at module load so a missing key is a
 * clear error on the one request that needed it, instead of a crash that takes
 * the whole site down at boot.
 */
function credentials() {
  const apiKey = process.env.SAFEPAY_API_KEY;
  const secretKey = process.env.SAFEPAY_SECRET_KEY;
  const webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET;

  if (!apiKey || !secretKey) {
    throw new Error(
      "Safepay is not configured: SAFEPAY_API_KEY and SAFEPAY_SECRET_KEY must be set"
    );
  }

  return { apiKey, secretKey, webhookSecret };
}

/** Whether card payments can be taken at all. Checked before an order is made. */
export function safepayConfigured() {
  return Boolean(process.env.SAFEPAY_API_KEY && process.env.SAFEPAY_SECRET_KEY);
}

/**
 * Safepay counts in the lowest denomination, so a figure here is paisa and a
 * price anywhere else in the shop is rupees. Getting this backwards charges a
 * shopper a hundred times too much or too little, so the conversion lives in
 * exactly one place and every amount goes through it.
 */
export function toPaisa(rupees: number) {
  return Math.round(rupees * 100);
}

/**
 * One call to Safepay, retried if the network drops it.
 *
 * Only failures where the request never landed are retried — a DNS blip or a
 * refused connection. A reply that came back, even an unhappy one, is left
 * alone: Safepay has an opinion at that point and asking twice would risk
 * opening two payment sessions for one order.
 */
async function request(path: string, init: RequestInit) {
  const { secretKey } = credentials();

  const url = HOSTS[environment()].api + path;

  const options: RequestInit = {
    ...init,
    headers: {
      Accept: "application/json",
      "x-sfpy-merchant-secret": secretKey,
      ...init.headers,
    },
    // Payment calls must never be served from a cache.
    cache: "no-store",
  };

  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 300));
    }

    let res: Response;

    try {
      res = await fetch(url, options);
    } catch (error) {
      // Never reached Safepay at all, so nothing can have been started.
      lastError = error;
      console.warn(
        `SAFEPAY ${path}: attempt ${attempt + 1} could not reach the gateway`
      );
      continue;
    }

    const text = await res.text();

    if (!res.ok) {
      // The body can quote our own key back at us; it must not reach a log.
      throw new Error(
        `Safepay ${path} failed with ${res.status}: ${redact(text).slice(0, 300)}`
      );
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Safepay ${path} returned a non-JSON body`);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Safepay ${path} was unreachable`);
}

function post(path: string, body: unknown) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function get(path: string) {
  return request(path, { method: "GET" });
}

/** Strips anything secret out of text on its way to an error or a log. */
function redact(text: string) {
  let out = text;

  for (const secret of [
    process.env.SAFEPAY_API_KEY,
    process.env.SAFEPAY_SECRET_KEY,
    process.env.SAFEPAY_WEBHOOK_SECRET,
  ]) {
    if (secret) out = out.split(secret).join("[redacted]");
  }

  return out;
}

/**
 * Opens a payment session and hands back the URL to send the shopper to.
 *
 * The order exists in our database before this is called and its id travels
 * with the session, so whatever Safepay tells us later can be matched back to
 * an order without trusting anything the browser says.
 */
export async function createCheckout({
  amountRupees,
  orderId,
  redirectUrl,
  cancelUrl,
}: {
  amountRupees: number;
  orderId: string;
  redirectUrl: string;
  cancelUrl: string;
}) {
  const { apiKey } = credentials();

  const session = await post("/order/payments/v3/", {
    merchant_api_key: apiKey,
    intent: "CYBERSOURCE",
    mode: "payment",
    entry_mode: "raw",
    currency: "PKR",
    amount: toPaisa(amountRupees),
  });

  const tracker: string | undefined = session?.data?.tracker?.token;

  if (!tracker) {
    throw new Error("Safepay did not return a tracker token");
  }

  // A short-lived token that lets Safepay's own page act for this session.
  const passport = await post("/client/passport/v1/token", {});
  const tbt: string | undefined = passport?.data;

  if (!tbt) {
    throw new Error("Safepay did not return a passport token");
  }

  const url = new URL(HOSTS[environment()].checkout);
  url.searchParams.set("environment", environment());
  url.searchParams.set("tracker", tracker);
  url.searchParams.set("tbt", tbt);
  url.searchParams.set("source", "hosted");
  url.searchParams.set("order_id", orderId);
  url.searchParams.set("redirect_url", redirectUrl);
  url.searchParams.set("cancel_url", cancelUrl);

  return { url: url.toString(), tracker };
}

export type PaymentOutcome = {
  /** True only when Safepay itself says the money was taken. */
  paid: boolean;
  /** What was actually charged, so it can be checked against the order. */
  chargedPaisa: number | null;
  /** Safepay's own word for where the payment got to, for the log. */
  state: string;
};

/**
 * Asks Safepay how a payment actually went.
 *
 * This is the shop's source of truth, and it is deliberately not built on
 * anything the shopper's browser carries back. Safepay's redirect arrives with
 * no signature on it — only an order id and a tracker, both of which anyone
 * could type — so believing it would let a shopper mark their own order paid.
 * This call goes out over the merchant secret instead, which the browser has
 * never seen and cannot forge.
 *
 * Returns null when the payment cannot be looked up at all, which is different
 * from a payment that is looked up and found unpaid.
 */
export async function fetchPaymentOutcome(
  tracker: string
): Promise<PaymentOutcome | null> {
  if (!tracker) return null;

  let body;

  try {
    body = await get(`/reporter/api/v1/payments/${encodeURIComponent(tracker)}`);
  } catch (error) {
    console.error("SAFEPAY FETCH PAYMENT ERROR:", error);
    return null;
  }

  const data = body?.data;

  if (!data) return null;

  const state = String(data.state ?? "");

  // A tracker that has ended and has a charge against it is the one shape that
  // means the money moved. A tracker still in progress, or ended without a
  // charge, has not paid for anything.
  const paid = state === "TRACKER_ENDED" && Boolean(data.charge?.token);

  const chargedPaisa =
    typeof data.charge?.amount?.amount === "number"
      ? data.charge.amount.amount
      : null;

  return { paid, chargedPaisa, state };
}

/**
 * Whether a result really came from Safepay.
 *
 * Safepay signs the tracker with the webhook secret, so anyone who has not got
 * that secret cannot produce a matching signature. This is the whole basis for
 * believing a payment happened: without it, a shopper could mark their own
 * order paid by opening the success URL with a tracker of their choosing.
 *
 * Returns false rather than throwing when the secret is missing, because an
 * unverifiable payment must be treated exactly like a forged one.
 */
export function verifySignature(tracker: string, signature: string) {
  const webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET;

  if (!webhookSecret || !tracker || !signature) return false;

  const expected = createHmac("sha256", webhookSecret)
    .update(tracker)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");

  // Lengths must match before timingSafeEqual will look at them, and comparing
  // byte by byte is what stops the signature being guessed a character at a
  // time off the response time.
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
