"use client";

import { useEffect } from "react";
import { useCart } from "../../context/CartContext";

/**
 * Empties the cart once the shopper has actually reached the success page.
 *
 * Card payments are why this exists rather than the checkout screen simply
 * clearing the cart before it redirects. A shopper who backs out of Safepay's
 * card form comes straight back to checkout, and finding their cart emptied by
 * an order they never paid for would leave them nothing to try again with.
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
