"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import ProductCard from "../../../components/ProductCard";
import { useCart } from "../../../context/CartContext";
import { CATEGORIES, type Category } from "../../../lib/categories";

// Same page size as the home page — a screenful at a time rather than every
// image in the collection up front.
const PAGE_SIZE = 24;

export default function CategoryView({ category }: { category: Category }) {
  const { cart, addToCart } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Every filter change makes a fresh list, so it starts from the top again.
  const showFirstPage = () => setVisible(PAGE_SIZE);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/products?category=${encodeURIComponent(category.name)}`
        );
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category.name]);

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "low":
          return a.price - b.price;

        case "high":
          return b.price - a.price;

        case "az":
          return a.name.localeCompare(b.name);

        case "za":
          return b.name.localeCompare(a.name);

        case "rating":
          // Unreviewed products sink to the bottom rather than tying at 0.
          return (b.rating ?? -1) - (a.rating ?? -1);

        default:
          return 0;
      }
    });

  return (
    <>
      <Navbar cart={cart.length} />

      <main className="page">

        {/* Collection header */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="hero py-12 sm:py-16 px-6 sm:px-10">
            <div className="hero-pattern" />

            <div className="relative text-center">
              <div className="text-5xl sm:text-6xl">{category.icon}</div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-4">
                {category.name}
              </h1>

              <p className="text-base sm:text-lg text-muted-soft max-w-2xl mx-auto">
                {category.tagline}
              </p>
            </div>
          </div>
        </section>

        {/* Other collections */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <Link href="/" className="chip">
              All Products
            </Link>

            {CATEGORIES.map((item) => (
              <Link
                key={item.slug}
                href={`/category/${item.slug}`}
                className={`chip ${
                  item.slug === category.slug ? "chip-active" : ""
                }`}
              >
                {item.icon} {item.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Search + sorting */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
          <input
            type="text"
            placeholder={`🔍 Search in ${category.name}...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              showFirstPage();
            }}
            className="field p-4 shadow-sm"
          />

          <div className="flex justify-end mt-4">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                showFirstPage();
              }}
              className="field w-auto px-4 py-2"
            >
              <option value="default">Sort By</option>
              <option value="low">Price: Low → High</option>
              <option value="high">Price: High → Low</option>
              <option value="az">Name: A → Z</option>
              <option value="za">Name: Z → A</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </section>

        {/* Products */}
        <section className="max-w-7xl mx-auto py-12 px-4 sm:px-6">
          {loading ? (
            <div className="text-center text-muted-soft text-xl">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-muted-soft text-xl">
              No products found in this collection.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.slice(0, visible).map((product) => (
                  <ProductCard
                    key={product._id}
                    id={product._id}
                    name={product.name}
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    image={product.image}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    onAddToCart={() =>
                      addToCart({
                        id: product._id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                      })
                    }
                  />
                ))}
              </div>

              <div className="text-center mt-10">
                <p className="text-muted-soft">
                  Showing {Math.min(visible, filteredProducts.length)} of{" "}
                  {filteredProducts.length} products
                </p>

                {visible < filteredProducts.length && (
                  <button
                    onClick={() => setVisible((count) => count + PAGE_SIZE)}
                    className="btn btn-outline btn-lg mt-4"
                  >
                    Load More
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
