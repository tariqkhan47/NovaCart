"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSignup() {
    if (!name || !email || !password) {
      alert("Please fill all fields.");
      return;
    }

    localStorage.setItem(
      "novacart-user",
      JSON.stringify({
        name,
        email,
      })
    );

    alert("Account created successfully!");
    router.push("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-8">
          Sign Up
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
            onClick={handleSignup}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
          >
            Create Account
          </button>

          <p className="text-center">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 font-semibold"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}