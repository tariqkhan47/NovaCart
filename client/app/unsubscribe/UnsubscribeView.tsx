"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useCart } from "../../context/CartContext";
import { STORE } from "../../lib/store";

type Status = "loading" | "ready" | "done" | "error";

export default function UnsubscribeView({ token }: { token: string }) {
  const { cart } = useCart();

  const [status, setStatus] = useState<Status>(token ? "loading" : "error");
  const [email, setEmail] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState(
    token ? "" : "This unsubscribe link is missing its code."
  );
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const res = await fetch(
          `/api/unsubscribe?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();

        if (!res.ok) throw new Error(data.message ?? "Something went wrong");

        setEmail(data.email);
        setActive(data.active);
        setStatus(data.active ? "ready" : "done");
      } catch (err) {
        setError((err as Error).message);
        setStatus("error");
      }
    };

    load();
  }, [token]);

  async function change(resubscribe: boolean) {
    setWorking(true);
    setError("");

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, resubscribe }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message ?? "Something went wrong");

      setActive(data.active);
      setStatus(data.active ? "ready" : "done");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <Navbar cart={cart.length} />

      <main className="page">
        <section className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="card p-6 sm:p-10 text-center">

            {status === "loading" && (
              <p className="text-muted-soft text-xl">Loading...</p>
            )}

            {status === "error" && (
              <>
                <div className="text-5xl">🔗</div>

                <h1 className="text-2xl sm:text-3xl font-bold mt-4">
                  Link not valid
                </h1>

                <p className="text-muted-soft mt-3">{error}</p>

                <p className="text-muted-soft text-sm mt-4">
                  Email{" "}
                  <a
                    href={`mailto:${STORE.email}`}
                    className="text-primary hover:underline break-words"
                  >
                    {STORE.email}
                  </a>{" "}
                  and we will take you off the list by hand.
                </p>
              </>
            )}

            {status === "ready" && (
              <>
                <div className="text-5xl">📬</div>

                <h1 className="text-2xl sm:text-3xl font-bold mt-4">
                  Stop emails from {STORE.name}?
                </h1>

                <p className="text-muted-soft mt-3 break-words">
                  We will stop sending offers and updates to{" "}
                  <span className="font-semibold">{email}</span>. Your orders
                  are not affected — receipts and delivery updates still come
                  through.
                </p>

                {error && <p className="text-danger mt-4">{error}</p>}

                <button
                  onClick={() => change(false)}
                  disabled={working}
                  className="btn btn-primary btn-lg btn-block mt-6"
                >
                  {working ? "Working..." : "Unsubscribe"}
                </button>

                <Link href="/" className="btn btn-outline btn-block mt-3">
                  Keep me subscribed
                </Link>
              </>
            )}

            {status === "done" && !active && (
              <>
                <div className="text-5xl">✅</div>

                <h1 className="text-2xl sm:text-3xl font-bold mt-4">
                  You are off the list
                </h1>

                <p className="text-muted-soft mt-3 break-words">
                  <span className="font-semibold">{email}</span> will not get
                  any more marketing email from us. Ordering again will not put
                  you back on the list.
                </p>

                {error && <p className="text-danger mt-4">{error}</p>}

                <button
                  onClick={() => change(true)}
                  disabled={working}
                  className="btn btn-outline btn-block mt-6"
                >
                  {working ? "Working..." : "Changed your mind? Resubscribe"}
                </button>

                <Link href="/" className="btn btn-primary btn-block mt-3">
                  Back to the shop
                </Link>
              </>
            )}

          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
