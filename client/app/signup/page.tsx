"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup() {
    if (!name || !email || !password) {
      alert("Please fill all fields.");
      return;
    }

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
        alert(data.message);
        return;
      }

      alert("Account created successfully!");
      router.push("/login");
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
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

          <button
            onClick={handleSignup}
            className="btn btn-primary btn-block btn-lg"
          >
            Create Account
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