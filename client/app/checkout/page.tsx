"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../lib/currency";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { user, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    // Prefill from the session so the customer does not retype it.
    if (user) {
      setName((current) => current || user.name);
      setEmail((current) => current || user.email);
    }
  }, [loading, user, router]);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  async function handleOrder() {
    setError("");

    if (!name || !email || !phone || !address) {
      setError("Please fill all fields.");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Only ids and quantities — the server prices the order itself.
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          name,
          email,
          phone,
          address,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Could not place your order.");
        return;
      }

      clearCart();
      router.push("/success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto panel p-5 sm:p-8">

        <div className="text-center mb-8">
          <span className="eyebrow">Almost There</span>
          <h1 className="text-3xl sm:text-4xl font-bold mt-3">
            Checkout
          </h1>
        </div>

        <div className="space-y-5">

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="field"
          />

          <textarea
            placeholder="Shipping Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="field h-32"
          />

          <div className="border-t divider pt-6">
            <h2 className="text-xl font-bold mb-4">
              Payment Method
            </h2>

            <div className="card p-4 sm:p-5 flex items-start gap-4">
              <span className="text-3xl shrink-0">🚚</span>

              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  Cash on Delivery
                </p>
                <p className="text-muted-soft text-sm mt-1">
                  Order milne par courier ko paise dein. Abhi sirf yehi
                  method available hai.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t divider pt-6 flex flex-wrap justify-between items-center gap-3">
            <h2 className="text-2xl font-bold">
              Total
            </h2>

            <span className="price text-2xl sm:text-3xl">
              {formatPrice(total)}
            </span>
          </div>

          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleOrder}
            disabled={submitting || cart.length === 0}
            className="btn btn-primary btn-block btn-lg"
          >
            {submitting ? "Placing order..." : "Place Order"}
          </button>

        </div>

      </div>
    </main>
  );
}
