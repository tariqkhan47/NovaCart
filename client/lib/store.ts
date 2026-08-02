/**
 * The shop's own details.
 *
 * Kept in one place so the footer, the contact links and anything added later
 * (order emails, invoices) all quote the same address and number.
 */
export const STORE = {
  name: "Arsalah",

  email: "aslitariq6@gmail.com",

  /** As a customer in Pakistan would write it. */
  phone: "0311 2424058",

  /** Same number in international form — what tel: and wa.me links need. */
  phoneIntl: "+92 311 2424058",

  /**
   * The return address, printed on shipping labels as the sender.
   *
   * A courier needs somewhere to bring a parcel back to when nobody answers
   * the door. Left blank until the owner fills it in, and the label simply
   * omits the line rather than printing a placeholder onto a box — a wrong
   * return address is worse than none.
   */
  address: "",

  country: "Pakistan",

  /**
   * Where the site lives. Only needed for links that leave the site and have
   * to come back — the unsubscribe link in an email, for one.
   */
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://nova-cart-eosin.vercel.app",
} as const;

/**
 * The link to put at the bottom of any bulk email.
 *
 * Customers land on the mailing list by ordering rather than by asking, so
 * every message has to carry a way off it — both because it is the decent
 * thing and because Gmail and Outlook file mail without one as spam.
 */
export function unsubscribeUrl(token: string) {
  return `${STORE.siteUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
}

export const CONTACT_LINKS = {
  email: `mailto:${STORE.email}`,
  phone: `tel:${STORE.phoneIntl.replace(/\s/g, "")}`,
  // wa.me wants digits only, no + and no spaces.
  whatsapp: `https://wa.me/${STORE.phoneIntl.replace(/\D/g, "")}`,
} as const;
