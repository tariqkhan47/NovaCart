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

  return (    <main className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8">

        <h1 className="text-4xl font-bold text-center mb-8">
          Checkout
        </h1>

        <div className="space-y-5">

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <textarea
            placeholder="Shipping Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded-lg p-3 h-32"
          />

          <div className="border-t pt-6">
            <h2 className="text-xl font-bold mb-4">
              Payment Method
            </h2>

            <label className="flex items-center gap-3 mb-3">
              <input
                type="radio"
                value="cod"
                checked={payment === "cod"}
                onChange={(e) => setPayment(e.target.value)}
              />
              Cash on Delivery
            </label>

            <label className="flex items-center gap-3 mb-3">
              <input
                type="radio"
                value="card"
                checked={payment === "card"}
                onChange={(e) => setPayment(e.target.value)}
              />
              Credit / Debit Card
            </label>

            <label className="flex items-center gap-3 mb-3">
              <input
                type="radio"
                value="jazzcash"
                checked={payment === "jazzcash"}
                onChange={(e) => setPayment(e.target.value)}
              />
              JazzCash
            </label>

            <label className="flex items-center gap-3">
              <input
                type="radio"
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
                className="w-full border rounded-lg p-3"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="border rounded-lg p-3"
                />

                <input
                  type="password"
                  placeholder="CVV"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="border rounded-lg p-3"
                />
              </div>

            </div>
          )}

          <div className="border-t pt-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              Total
            </h2>

            <span className="text-3xl font-bold text-blue-600">
              ${total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleOrder}
            className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg hover:bg-blue-700"
          >
            Place Order
          </button>

        </div>

      </div>
    </main>
  );
}