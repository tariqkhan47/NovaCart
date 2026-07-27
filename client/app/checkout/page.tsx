"use client";
import { useOrders } from "../../context/OrderContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
const { placeOrder } = useOrders();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [payment, setPayment] = useState("cod");

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("novacart-user");

    if (!user) {
      alert("Please login first.");
      router.push("/login");
    }
  }, [router]);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function handleOrder() {
  if (!name || !email || !phone || !address) {
    alert("Please fill all fields.");
    return;
  }

  if (
    payment === "card" &&
    (!cardNumber || !expiry || !cvv)
  ) {
    alert("Please enter your card details.");
    return;
  }

  if (payment === "jazzcash") {
    alert("Redirecting to JazzCash...");
  }

  if (payment === "easypaisa") {
    alert("Redirecting to EasyPaisa...");
  }

  // Save Order
  placeOrder(cart, total);

  alert("Order Placed Successfully!");

  clearCart();

  router.push("/success");
}

  return (    <main className="page py-12 px-6">
      <div className="max-w-3xl mx-auto panel p-8">

        <div className="text-center mb-8">
          <span className="eyebrow">Almost There</span>
          <h1 className="text-4xl font-bold mt-3">
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

            <label className="flex items-center gap-3 mb-3">
              <input
                type="radio"
                className="accent-primary w-4 h-4"
                value="cod"
                checked={payment === "cod"}
                onChange={(e) => setPayment(e.target.value)}
              />
              Cash on Delivery
            </label>

            <label className="flex items-center gap-3 mb-3">
              <input
                type="radio"
                className="accent-primary w-4 h-4"
                value="card"
                checked={payment === "card"}
                onChange={(e) => setPayment(e.target.value)}
              />
              Credit / Debit Card
            </label>

            <label className="flex items-center gap-3 mb-3">
              <input
                type="radio"
                className="accent-primary w-4 h-4"
                value="jazzcash"
                checked={payment === "jazzcash"}
                onChange={(e) => setPayment(e.target.value)}
              />
              JazzCash
            </label>

            <label className="flex items-center gap-3">
              <input
                type="radio"
                className="accent-primary w-4 h-4"
                value="easypaisa"
                checked={payment === "easypaisa"}
                onChange={(e) => setPayment(e.target.value)}
              />
              EasyPaisa
            </label>
          </div>

          {payment === "card" && (
            <div className="space-y-4 mt-4">

              <input
                type="text"
                placeholder="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="field"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="field"
                />

                <input
                  type="password"
                  placeholder="CVV"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="field"
                />
              </div>

            </div>
          )}

          <div className="border-t divider pt-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              Total
            </h2>

            <span className="price text-3xl">
              ${total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleOrder}
            className="btn btn-primary btn-block btn-lg"
          >
            Place Order
          </button>

        </div>

      </div>
    </main>
  );
}