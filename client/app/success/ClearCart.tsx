"use client";

import { useEffect } from "react";
import { useCart } from "../../context/CartContext";

/**
 * Empties the cart once the shopper has actually reached the success page.
 *
 * Kept here rather than in the checkout screen's submit handler so the cart
 * only goes when the order is genuinely through. It was written for the card
 * gateway, which could send a shopper back mid-payment; the shop no longer
 * takes cards, but clearing on arrival is still the safer of the two places.
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
