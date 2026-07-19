"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWishlist } from "../context/WishlistContext";
import { useTheme } from "../context/ThemeContext";

type NavbarProps = {
  cart: number;
};

export default function Navbar({ cart }: NavbarProps) {
  const { wishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState<{
    name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("novacart-user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("novacart-user");
    window.location.reload();
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        <Link href="/">
          <h1 className="text-3xl font-bold text-blue-600">
            NovaCart
          </h1>
        </Link>

        <div className="flex items-center gap-5">

          <Link href="/">Home</Link>

          <Link href="/">Products</Link>

          <a href="#">Categories</a>

          <a href="#">Contact</a>

          <Link href="/wishlist">
            <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700">
              ❤️ Wishlist ({wishlist.length})
            </button>
          </Link>

          <Link href="/cart">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              🛒 Cart ({cart})
            </button>
          </Link>

          {/* Dark Mode Button */}
          <button
            onClick={toggleTheme}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>

          {user ? (
            <>
              <span className="font-semibold text-green-600">
                👋 {user.name}
              </span>

              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white">
                  Login
                </button>
              </Link>

              <Link href="/signup">
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Sign Up
                </button>
              </Link>
            </>
          )}

        </div>
      </div>
    </nav>
  );
}