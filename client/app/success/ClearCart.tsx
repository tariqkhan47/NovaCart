"use client";

import { useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { trackTikTok } from "../../lib/tiktok";

/**
 * Empties the cart once the shopper has actually reached the success page,
 * and tells TikTok the order happened.
 *
 * Kept here rather than in the checkout screen's submit handler so the cart
 * only goes when the order is genuinely through. It was written for the card
 * gateway, which could send a shopper back mid-payment; the shop no longer
 * takes cards, but clearing on arrival is still the safer of the two places —
 * and it is the right place for the conversion event for the same reason.
 */
export default function ClearCart() {
  const { cart, clearCart } = useCart();

  useEffect(() => {
    // Read before clearing: the cart is what the order was, and a moment
    // later it is empty. PlaceAnOrder rather than CompletePayment, because
    // Cash on Delivery means nothing has been paid yet — see lib/tiktok.ts.
    trackTikTok("PlaceAnOrder", {
      content_type: "product",
      quantity: cart.reduce((sum, item) => sum + item.quantity, 0),
      value: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    });

    clearCart();
    // Runs once on arrival. clearCart is not in the deps because it is
    // redefined on every render of the provider, which would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
