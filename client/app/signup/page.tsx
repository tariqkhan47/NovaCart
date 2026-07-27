"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSignup() {
    setError("");

    if (!name || !email || !password) {
      setError("Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Could not create your account.");
        return;
      }

      router.push("/login");
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page flex items-center justify-center px-6">
      <div className="panel p-8 w-full max-w-md">
        <div className="text-center mb-7">
          <span className="eyebrow">Join NovaCart</span>
          <h1 className="text-3xl font-bold mt-3">
            Sign Up
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
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />

          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleSignup}
            disabled={submitting}
            className="btn btn-primary btn-block btn-lg"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-muted-soft">
            Already have an account?{" "}
            <Link
              href="/login"
              className="link-brand"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}