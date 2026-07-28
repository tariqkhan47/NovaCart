"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWishlist } from "../context/WishlistContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

type NavbarProps = {
  cart: number;
};

export default function Navbar({ cart }: NavbarProps) {
  const { wishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();

  // Only affects the stacked menu; the row layout is always open.
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  async function handleLogout() {
    close();
    await logout();
    router.push("/");
    router.refresh();
  }

  // Rendered twice — as a row on desktop and stacked in the drop-down on
  // phones — so every button is full width below md and shrinks back after.
  const menu = (
    <>
      <Link href="/" className="nav-link py-1 md:py-0" onClick={close}>
        Home
      </Link>

      <Link href="/" className="nav-link py-1 md:py-0" onClick={close}>
        Products
      </Link>

      <a href="#" className="nav-link py-1 md:py-0" onClick={close}>
        Categories
      </a>

      <a href="#" className="nav-link py-1 md:py-0" onClick={close}>
        Contact
      </a>

      <Link href="/wishlist" className="w-full md:w-auto" onClick={close}>
        <button className="btn btn-outline btn-sm w-full md:w-auto">
          ♥ Wishlist ({wishlist.length})
        </button>
      </Link>

      <button
        onClick={toggleTheme}
        aria-label="Toggle colour theme"
        className="btn btn-dark btn-sm w-full md:w-auto"
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>

      {user ? (
        <>
          <span className="font-semibold text-foreground">
            👋 {user.name}
          </span>

          {isAdmin && (
            <Link href="/admin" className="w-full md:w-auto" onClick={close}>
              <button className="btn btn-dark btn-sm w-full md:w-auto">
                Admin
              </button>
            </Link>
          )}

          <Link
            href="/orders"
            className="nav-link py-1 md:py-0"
            onClick={close}
          >
            My Orders
          </Link>

          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm w-full md:w-auto"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="w-full md:w-auto" onClick={close}>
            <button className="btn btn-outline btn-sm w-full md:w-auto">
              Login
            </button>
          </Link>

          <Link href="/signup" className="w-full md:w-auto" onClick={close}>
            <button className="btn btn-dark btn-sm w-full md:w-auto">
              Sign Up
            </button>
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">

        <Link href="/" onClick={close}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Nova<span className="text-primary">Cart</span>
          </h1>
        </Link>

        <div className="hidden md:flex flex-wrap items-center gap-x-5 gap-y-3">
          {menu}
        </div>

        {/* Cart stays out of the drop-down: in a shop it should always be
            one tap away, never behind a menu. */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/cart" onClick={close}>
            <button className="btn btn-primary btn-sm whitespace-nowrap">
              🛒 Cart ({cart})
            </button>
          </Link>

          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="btn btn-outline btn-sm md:hidden text-lg leading-none px-3"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>

      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 flex flex-col items-start gap-3">
          {menu}
        </div>
      )}
    </header>
  );
}
