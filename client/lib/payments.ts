/**
 * How a customer can pay, and where the money lands.
 *
 * Kept beside the shop's own details in store.ts and read by all three sides
 * of a payment — the checkout screen, the order API and the admin dashboard —
 * so a method can never be offered on one screen and rejected by another.
 */

export const PAYMENT_METHODS = [
  "cod",
  "easypaisa",
  "bank",
  "card",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Where an order stands with the money — a different question from where it
 * stands with the courier, which is the order status.
 *
 * pending   — nothing has moved yet. Cash on Delivery sits here until the
 *             courier collects.
 * submitted — the customer says they have transferred and quoted a reference.
 *             Nobody has checked the account yet.
 * paid      — seen in the account and confirmed.
 * failed    — no such transfer arrived, or not for the right amount.
 */
export const PAYMENT_STATUSES = [
  "pending",
  "submitted",
  "paid",
  "failed",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

type WalletAccount = {
  /** The name the wallet is registered in, so the sender can check it. */
  title: string;
  /** The mobile number the wallet hangs off, as a Pakistani would write it. */
  number: string;
};

type BankAccount = {
  bank: string;
  title: string;
  /** What internet banking asks for. */
  iban: string;
  /** What a branch or an ATM transfer asks for instead. */
  accountNumber: string;
  /** Only needed by someone depositing cash over the counter. */
  branch: string;
};

/**
 * The accounts customers send money to.
 *
 * A method whose account is left blank is not offered at checkout — so the
 * shop can never show a shopper a number to pay into that nobody is watching.
 * These are printed on the checkout page by design; there is nothing secret in
 * them.
 *
 * Numbers are stored as unbroken digits, no spaces or dashes: shoppers copy
 * them straight into a banking app, and a stray space is a rejected transfer.
 */
export const PAYMENT_ACCOUNTS: {
  easypaisa: WalletAccount;
  bank: BankAccount;
} = {
  easypaisa: {
    title: "Tariq Khan",
    number: "03112424058",
  },

  bank: {
    bank: "Meezan Bank Limited",
    title: "TARIQ KHAN",
    iban: "PK88MEZN0016060112674586",
    accountNumber: "16060112674586",
    branch: "Auto Bhan Br - Hyderabad",
  },
};

/**
 * Card is not offered. The owner asked for it off the shop on 2026-08-02 —
 * it had been sitting at checkout greyed out as "Coming soon" while the
 * merchant paperwork went through, and he decided against taking cards at all.
 *
 * Deliberately removed from `paymentMethods()` rather than left in and
 * disabled. That list is the one the order API checks too, so dropping the
 * entry closes the door on both sides: a hand-made POST asking for `card` is
 * now refused with "That payment method is not available", not just hidden
 * from the page.
 *
 * `"card"` stays in PAYMENT_METHODS and in the label map below, because
 * orders placed while it was live still have to read correctly in the admin
 * dashboard and in a customer's order history. The Safepay integration
 * (lib/safepay.ts, the two routes under api/payments/safepay) is left in
 * place and unreachable — nothing routes to it any more, and it is what a
 * change of mind would need.
 */
const RETIRED_METHOD_LABELS: Record<string, string> = {
  card: "Debit / Credit Card",
};

export type PaymentMethodInfo = {
  method: PaymentMethod;
  label: string;
  icon: string;
  /** The line under the label at checkout. */
  blurb: string;
  /**
   * Whether the customer has to quote what they sent. True for every method
   * where the money moves before the order does, which is what gives the
   * owner something to match against the account statement.
   */
  needsReference: boolean;
  /** What that reference is called on the customer's receipt. */
  referenceLabel?: string;
  available: boolean;
  /** Shown next to a greyed-out option, in place of the blurb. */
  unavailableNote?: string;
  /** The account to pay into, ready to print as rows. */
  account?: { label: string; value: string }[];
};

function walletIsSet(account: WalletAccount) {
  return account.title.trim() !== "" && account.number.trim() !== "";
}

function bankIsSet(account: BankAccount) {
  return (
    account.title.trim() !== "" &&
    (account.iban.trim() !== "" || account.accountNumber.trim() !== "")
  );
}

/** Drops the rows the owner has not filled in, so no blank line is printed. */
function rows(entries: { label: string; value: string }[]) {
  return entries.filter((entry) => entry.value.trim() !== "");
}

/**
 * Every method the shop knows about, in the order they are offered — cash
 * first because it is what most of the country still uses.
 */
export function paymentMethods(): PaymentMethodInfo[] {
  const { easypaisa, bank } = PAYMENT_ACCOUNTS;

  return [
    {
      method: "cod",
      label: "Cash on Delivery",
      icon: "🚚",
      blurb: "Order milne par courier ko paise dein.",
      needsReference: false,
      available: true,
    },

    {
      method: "easypaisa",
      label: "EasyPaisa",
      icon: "💸",
      blurb: "EasyPaisa se paise bhej kar Transaction ID likh dein.",
      needsReference: true,
      referenceLabel: "Transaction ID (TID)",
      available: walletIsSet(easypaisa),
      unavailableNote: "Coming soon",
      account: rows([
        { label: "Account title", value: easypaisa.title },
        { label: "EasyPaisa number", value: easypaisa.number },
      ]),
    },

    {
      method: "bank",
      label: "Bank Transfer",
      icon: "🏦",
      blurb: "Bank ya app se transfer karke reference number likh dein.",
      needsReference: true,
      referenceLabel: "Transaction / reference number",
      available: bankIsSet(bank),
      unavailableNote: "Coming soon",
      account: rows([
        { label: "Bank", value: bank.bank },
        { label: "Account title", value: bank.title },
        { label: "IBAN", value: bank.iban },
        { label: "Account number", value: bank.accountNumber },
        { label: "Branch", value: bank.branch },
      ]),
    },

  ];
}

export function paymentMethodInfo(method: string): PaymentMethodInfo | undefined {
  return paymentMethods().find((info) => info.method === method);
}

/**
 * What the admin dashboard and the customer's order list call a method. Falls
 * back to the stored value so an order placed under a method that has since
 * been switched off still reads sensibly.
 */
export function paymentMethodLabel(method: string) {
  return (
    paymentMethodInfo(method)?.label ?? RETIRED_METHOD_LABELS[method] ?? method
  );
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Awaiting payment",
  submitted: "Awaiting verification",
  paid: "Paid",
  failed: "Payment failed",
};

/**
 * Where a freshly placed order starts.
 *
 * Cash on Delivery owes nothing yet. A card order owes nothing yet either —
 * it is created before the shopper is sent to the gateway, and only the
 * gateway's own word moves it to paid, so it must not start out claiming
 * anything happened.
 *
 * EasyPaisa and bank transfer have the customer's word that the money is on
 * its way, which is not the same as it having arrived.
 */
export function initialPaymentStatus(method: PaymentMethod): PaymentStatus {
  return method === "cod" || method === "card" ? "pending" : "submitted";
}
