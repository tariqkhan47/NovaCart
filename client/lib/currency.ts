// One place decides how money looks across the whole store.
// Fixed locale on purpose: it must render identically on the server and the
// client, otherwise React reports a hydration mismatch.
const formatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  if (!Number.isFinite(amount)) return "Rs 0";

  return formatter.format(amount);
}
