"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin() {
    if (!email || !password) {
      alert("Please fill all fields.");
      return;
    }

    localStorage.setItem(
      "novacart-user",
      JSON.stringify({
        name: "NovaCart User",
        email,
      })
    );

    alert("Login Successful!");
    router.push("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-8">
          Login
        </h1>

        <div className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Login
          </button>

          <p className="text-center">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-blue-600 font-semibold"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}