"use client";

import { useEffect } from "react";
import { useCart } from "../../context/CartContext";

/**
 * Empties the cart once the shopper has actually reached the success page.
 *
 * A backstop rather than the main event: checkout already clears the cart the
 * moment the order comes back placed. This catches the shopper who somehow
 * lands here without going through that path, and costs nothing when the cart
 * is already empty.
 *
 * The PlaceAnOrder event deliberately does not live here. It cannot: by the
 * time this mounts the cart has been emptied, so it reported value 0 and no
 * content ids, and a refresh of this page counted a second order.
 */
export default function ClearCart() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // Runs once on arrival. clearCart is not in the deps because it is
    // redefined on every render of the provider, which would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
