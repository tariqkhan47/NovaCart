"use client";

import { STORE } from "../lib/store";
import { formatPrice } from "../lib/currency";
import { paymentMethodLabel } from "../lib/payments";
import type { Order } from "../types/order";

/**
 * The slip that goes on the outside of the box.
 *
 * Invisible on screen and only drawn by the printer — see the `@media print`
 * block in globals.css, which hides the dashboard around it. Rendering it
 * inline rather than opening a separate page keeps the admin's session and
 * data exactly where they already are; a /label route would have to fetch the
 * order again and re-authenticate to print one slip.
 *
 * Laid out for the person carrying it, not for the shop. The courier reads two
 * things off a parcel — where it goes and how much to collect — so those are
 * the two largest blocks on the page, and everything else is small.
 */
type ShippingLabelProps = {
  order: Order | null;
};

export default function ShippingLabel({ order }: ShippingLabelProps) {
  if (!order) return null;

  // Cash on Delivery is the only method where the courier handles money. For
  // anything else the shop has already been paid, and a number printed beside
  // the address is an invitation to collect it twice.
  const collectOnDelivery = order.paymentMethod === "cod";

  const placed = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Written without the scheme: it goes on a box, where nobody types "https://".
  const site = STORE.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="shipping-label" aria-hidden="true">
      <div className="label-head">
        <div>
          <p className="label-brand">{STORE.name}</p>
          <p className="label-site">{site}</p>
        </div>

        <div className="label-order">
          <p className="label-order-no">ORDER #{order._id}</p>
          <p className="label-date">{placed}</p>
        </div>
      </div>

      <div className="label-block">
        <p className="label-caption">Deliver to</p>
        <p className="label-name">{order.customer.name}</p>
        <p className="label-address">{order.customer.address}</p>
        <p className="label-phone">{order.customer.phone}</p>
        {order.customer.email && (
          <p className="label-muted">{order.customer.email}</p>
        )}
      </div>

      {/* The number the courier is accountable for. Boxed and oversized on
          purpose: it is read at a doorstep, often in bad light, and getting it
          wrong costs the shop the difference. */}
      {collectOnDelivery ? (
        <div className="label-cod">
          <p className="label-caption">Collect on delivery</p>
          <p className="label-cod-amount">{formatPrice(order.total)}</p>
        </div>
      ) : (
        <div className="label-paid">
          <p className="label-caption">Already paid — collect nothing</p>
          <p className="label-paid-note">
            {paymentMethodLabel(order.paymentMethod)} · {formatPrice(order.total)}
          </p>
        </div>
      )}

      <div className="label-columns">
        <div>
          <p className="label-caption">Return to</p>
          <p className="label-from">{STORE.name}</p>
          {STORE.address && <p className="label-from">{STORE.address}</p>}
          <p className="label-from">{STORE.phone}</p>
          <p className="label-from">{STORE.country}</p>
        </div>

        {/* Not for the courier — for whoever packs the box, to check against
            what is going in it before it is taped shut. */}
        <div>
          <p className="label-caption">Contents</p>
          <ul className="label-items">
            {order.items.map((item, index) => (
              <li key={index}>
                {item.quantity} × {item.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="label-foot">
        Questions about this parcel: {STORE.phone} · {STORE.email}
      </p>
    </div>
  );
}
