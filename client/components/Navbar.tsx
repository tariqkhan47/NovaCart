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
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-4">

        <Link href="/">
          <h1 className="text-3xl font-bold text-foreground">
            Nova<span className="text-primary">Cart</span>
          </h1>
        </Link>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">

          <Link href="/" className="nav-link">Home</Link>

          <Link href="/" className="nav-link">Products</Link>

          <a href="#" className="nav-link">Categories</a>

          <a href="#" className="nav-link">Contact</a>

          <Link href="/wishlist">
            <button className="btn btn-outline btn-sm">
              ♥ Wishlist ({wishlist.length})
            </button>
          </Link>

          <Link href="/cart">
            <button className="btn btn-primary btn-sm">
              🛒 Cart ({cart})
            </button>
          </Link>

          {/* Dark Mode Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle colour theme"
            className="btn btn-dark btn-sm"
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>

          {user ? (
            <>
              <span className="font-semibold text-foreground">
                👋 {user.name}
              </span>

              <button
                onClick={handleLogout}
                className="btn btn-danger btn-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="btn btn-outline btn-sm">
                  Login
                </button>
              </Link>

              <Link href="/signup">
                <button className="btn btn-dark btn-sm">
                  Sign Up
                </button>
              </Link>
            </>
          )}

        </div>
      </div>
    </header>
  );
}
