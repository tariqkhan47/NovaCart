"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useCart } from "../../context/CartContext";
import { CATEGORIES } from "../../lib/categories";

export default function CollectionsView() {
  const { cart } = useCart();

  return (
    <>
      <Navbar cart={cart.length} />

      <main className="page">

        <section className="hero py-12 sm:py-16">
          <div className="hero-pattern" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <span className="eyebrow text-brand-300">Browse By</span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-4">
              Collections
            </h1>

            <p className="text-base sm:text-lg text-brand-50/80 max-w-2xl mx-auto">
              {CATEGORIES.length} collections, from kitchen tools to smart
              watches.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto py-12 px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="card card-hover p-6 sm:p-8"
              >
                <div className="text-4xl sm:text-5xl">{category.icon}</div>

                <h2 className="mt-4 text-xl font-bold text-foreground">
                  {category.name}
                </h2>

                <p className="mt-2 text-sm text-muted-soft">
                  {category.tagline}
                </p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/" className="btn btn-outline btn-lg">
              Browse everything
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
