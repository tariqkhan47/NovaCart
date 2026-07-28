/**
 * The shop's own details.
 *
 * Kept in one place so the footer, the contact links and anything added later
 * (order emails, invoices) all quote the same address and number.
 */
export const STORE = {
  name: "NovaCart",

  email: "aslitariq6@gmail.com",

  /** As a customer in Pakistan would write it. */
  phone: "0311 2424058",

  /** Same number in international form — what tel: and wa.me links need. */
  phoneIntl: "+92 311 2424058",

  country: "Pakistan",
} as const;

export const CONTACT_LINKS = {
  email: `mailto:${STORE.email}`,
  phone: `tel:${STORE.phoneIntl.replace(/\s/g, "")}`,
  // wa.me wants digits only, no + and no spaces.
  whatsapp: `https://wa.me/${STORE.phoneIntl.replace(/\D/g, "")}`,
} as const;
