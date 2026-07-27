"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    if (!email || !password) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      localStorage.setItem(
        "novacart-user",
        JSON.stringify(data.user)
      );

      alert("Login Successful!");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
  }

  return (
    <main className="page flex items-center justify-center px-6">
      <div className="panel p-8 w-full max-w-md">
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

          <button
            onClick={handleLogin}
            className="btn btn-primary btn-block btn-lg"
          >
            Login
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