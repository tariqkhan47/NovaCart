"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";

function AdminLoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(email, password);

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    // The session cookie decides what happens next: proxy.ts bounces
    // non-admins straight back here.
    router.push(searchParams.get("next") || "/admin");
    router.refresh();
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">

      <input
        type="email"
        placeholder="Admin email"
        className="field"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="field"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <p className="text-danger text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary btn-block btn-lg"
      >
        {submitting ? "Checking..." : "Login"}
      </button>

    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="page flex items-center justify-center px-4 sm:px-6">
      <div className="panel p-5 sm:p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <span className="eyebrow">Restricted Area</span>
          <h1 className="text-3xl font-bold mt-3">
            🔐 Admin Login
          </h1>
        </div>

        {/* useSearchParams needs a Suspense boundary during prerender. */}
        <Suspense fallback={<div className="h-64" />}>
          <AdminLoginForm />
        </Suspense>

      </div>
    </main>
  );
}
