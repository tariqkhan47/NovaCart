"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWishlist } from "../context/WishlistContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { CONTACT_LINKS } from "../lib/store";

type NavbarProps = {
  cart: number;
};

// The first Kalima — La ilaha illallah Muhammadur Rasulullah.
//
// Set the way it is printed in the subcontinent, which is what the shop was
// asked for: madd on the alif of لَآ, shadda on the ra of رَّسُولُ, and the
// name of Allah with its shadda and superscript alef.
//
// Held in a constant because it is rendered twice below, once for the top row
// and once for phones, and the two must never drift apart. Every mark in it is
// deliberate — a find-and-replace or an editor that "tidies" Unicode changes
// what the line says. Leave the string alone.
const KALIMA = "لَآ إِلٰهَ إِلَّا اللّٰهُ مُحَمَّدٌ رَّسُوْلُ اللّٰهِ";

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

  // Rendered twice — as its own row on desktop and stacked in the drop-down on
  // phones — so every button is full width below md and shrinks back after.
  const menu = (
    <>
      <Link href="/" className="nav-link py-1 md:py-0" onClick={close}>
        Home
      </Link>

      <Link href="/#products" className="nav-link py-1 md:py-0" onClick={close}>
        Products
      </Link>

      <Link href="/category" className="nav-link py-1 md:py-0" onClick={close}>
        Categories
      </Link>

      <a
        href={CONTACT_LINKS.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="nav-link py-1 md:py-0"
        onClick={close}
      >
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
      {/* Two rows on desktop rather than one. Signed in as an admin the menu
          runs to nine items, which no single line holds at this font size —
          squeezed onto one it wrapped, and the stray "Logout" hanging under
          the logo looked like a mistake. Given the row breaks either way, it
          may as well break somewhere deliberate. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">

        <Link href="/" className="shrink-0" onClick={close}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Arsalah
          </h1>
        </Link>

        {/* Centred in what is left between the logo and the cart. Hidden below
            md and shown on its own line instead: on a 360px phone that gap is
            about 45px wide, and no size the kalima could be shrunk to would be
            both legible and inside it. */}
        <p className="kalima hidden md:block" lang="ar" dir="rtl">
          {KALIMA}
        </p>

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

      {/* The phone's copy of it, full width so it has the room the top row
          cannot give it. */}
      <p
        className="kalima md:hidden border-t border-border py-1 text-center"
        lang="ar"
        dir="rtl"
      >
        {KALIMA}
      </p>

      {/* The links, centred on their own line under the logo. Still wraps if it
          has to — a narrow laptop or a longer name should push a button onto a
          third line rather than off the edge. */}
      <div className="hidden md:block border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {menu}
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
