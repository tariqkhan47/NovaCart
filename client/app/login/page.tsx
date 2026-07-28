"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setError("");

    if (!email || !password) {
      setError("Please fill all fields.");
      return;
    }

    setSubmitting(true);

    const result = await login(email, password);

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="page flex items-center justify-center px-4 sm:px-6">
      <div className="panel p-5 sm:p-8 w-full max-w-md">
        <div className="text-center mb-7">
          <span className="eyebrow">Welcome Back</span>
          <h1 className="text-3xl font-bold mt-3">
            Login
          </h1>
        </div>

        <div className="space-y-5">
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
            onClick={handleLogin}
            disabled={submitting}
            className="btn btn-primary btn-block btn-lg"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>

          <p className="text-center text-muted-soft">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="link-brand"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}