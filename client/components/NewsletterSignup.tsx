"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSending(true);
    setMessage("");
    setFailed(false);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      setMessage(data.message ?? "Something went wrong. Please try again.");
      setFailed(!res.ok);

      if (res.ok) setEmail("");
    } catch {
      setMessage("Something went wrong. Please try again.");
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
      <div className="md:flex md:items-center md:justify-between md:gap-8">
        <div className="md:max-w-md">
          <h3 className="text-xl font-bold text-white">
            Get our best deals first
          </h3>

          <p className="mt-2 text-ink-100/80">
            New arrivals and offers, straight to your inbox. Leave whenever you
            like.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-5 md:mt-0 flex flex-col sm:flex-row gap-3 md:min-w-[22rem]"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>

          <input
            id="newsletter-email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field bg-white/10 border-white/20 text-white placeholder:text-ink-100/50"
          />

          <button
            type="submit"
            disabled={sending}
            className="btn btn-primary whitespace-nowrap"
          >
            {sending ? "Signing up..." : "Subscribe"}
          </button>
        </form>
      </div>

      {message && (
        <p
          role="status"
          className={`mt-4 text-sm ${failed ? "text-danger" : "text-brand-300"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
