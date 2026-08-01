"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../lib/currency";
import { DELIVERY_CHARGE } from "../../lib/delivery";
import { paymentMethods, type PaymentMethod } from "../../lib/payments";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { user, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [reference, setReference] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Which methods exist, and which of them the owner has actually set an
  // account up for. Cash on Delivery is always among them, so there is never
  // an empty list to guard against.
  const methods = paymentMethods();
  const chosen = methods.find((info) => info.method === method);

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

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // An empty cart is not an order, so it should not be quoted a delivery fee.
  const delivery = cart.length > 0 ? DELIVERY_CHARGE : 0;
  const total = subtotal + delivery;

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

    if (!chosen?.available) {
      setError("Please choose a payment method.");
      return;
    }

    // A transfer nobody can trace is worse than no transfer: without this the
    // owner has an order claiming to be paid and no way to find the money.
    if (chosen.needsReference && !reference.trim()) {
      setError(`Please enter the ${chosen.referenceLabel}.`);
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
          paymentMethod: method,
          paymentReference: reference,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Could not place your order.");
        return;
      }

      clearCart();

      // The success page says something different to someone who has already
      // transferred than to someone paying the courier.
      router.push(`/success?payment=${method}`);
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

            <div className="space-y-3">
              {methods.map((info) => {
                const selected = info.method === method;

                return (
                  <div key={info.method}>
                    <label
                      className={`card p-4 sm:p-5 flex items-start gap-4 ${
                        info.available
                          ? "cursor-pointer"
                          : "opacity-60 cursor-not-allowed"
                      } ${selected ? "border-primary" : ""}`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={info.method}
                        checked={selected}
                        disabled={!info.available}
                        onChange={() => {
                          setMethod(info.method);
                          // A TID belongs to the method it was sent through.
                          setReference("");
                          setError("");
                        }}
                        className="mt-1.5 shrink-0 accent-primary"
                      />

                      <span className="text-3xl shrink-0" aria-hidden="true">
                        {info.icon}
                      </span>

                      <span className="min-w-0">
                        <span className="block font-semibold text-foreground">
                          {info.label}
                        </span>

                        <span className="block text-muted-soft text-sm mt-1">
                          {info.available ? info.blurb : info.unavailableNote}
                        </span>
                      </span>
                    </label>

                    {/* The account to pay into, opened only under the method
                        actually chosen — five sets of bank details on one
                        screen is how people transfer to the wrong one. */}
                    {selected && info.needsReference && (
                      <div className="mt-3 sm:ml-12 space-y-3">
                        <div className="surface-muted border border-border rounded-xl p-4">
                          <p className="text-sm text-muted-soft">
                            Is account par{" "}
                            <strong className="text-foreground">
                              {formatPrice(total)}
                            </strong>{" "}
                            bhejein, phir {info.referenceLabel} neeche likh
                            dein. Payment confirm hone par order aage barhega.
                          </p>

                          <dl className="mt-4 space-y-2">
                            {info.account?.map((row) => (
                              <div
                                key={row.label}
                                className="flex flex-wrap justify-between items-baseline gap-x-4 gap-y-1"
                              >
                                <dt className="text-muted-soft text-sm">
                                  {row.label}
                                </dt>

                                <dd className="font-semibold break-all">
                                  {row.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>

                        <input
                          type="text"
                          placeholder={info.referenceLabel}
                          value={reference}
                          onChange={(e) => setReference(e.target.value)}
                          className="field"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t divider pt-6 space-y-3">
            <div className="flex justify-between items-center gap-3">
              <span className="text-muted-soft">Subtotal</span>

              <span className="font-semibold">
                {formatPrice(subtotal)}
              </span>
            </div>

            <div className="flex justify-between items-start gap-3">
              <span className="text-muted-soft">
                Delivery
                <span className="block text-sm">
                  Flat rate, all over Pakistan
                </span>
              </span>

              <span className="font-semibold whitespace-nowrap">
                {formatPrice(delivery)}
              </span>
            </div>

            <div className="border-t divider pt-4 flex flex-wrap justify-between items-center gap-3">
              <h2 className="text-2xl font-bold">
                Total
              </h2>

              <span className="price text-2xl sm:text-3xl">
                {formatPrice(total)}
              </span>
            </div>
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
