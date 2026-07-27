"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";

export default function AdminLoginPage() {
    const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const success = login(username, password);

    if (success) {
      alert("✅ Login Successful");
      router.push("/admin");
    } else {
      alert("❌ Invalid Username or Password");
    }
  };

  return (
    <main className="page flex items-center justify-center px-6">
      <div className="panel p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <span className="eyebrow">Restricted Area</span>
          <h1 className="text-3xl font-bold mt-3">
            🔐 Admin Login
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          <input
            type="text"
            placeholder="Username"
            className="field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
          >
            Login
          </button>

        </form>

      </div>
    </main>
  );
}