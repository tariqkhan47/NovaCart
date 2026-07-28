"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";

export default function Home() {
const { cart, addToCart } = useCart();
const [products, setProducts] = useState<any[]>([]);

useEffect(() => {
  fetchProducts();
}, []);

const fetchProducts = async () => {
  try {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  } catch (error) {
    console.error(error);
  }
};
const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" ||
        product.category === category;

      return matchesSearch && matchesCategory;
    })
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

        {/* Hero Section */}
        <section className="hero py-24">
          <div className="hero-pattern" />

          <div className="relative max-w-7xl mx-auto px-6 text-center">
            <span className="eyebrow text-brand-300">
              Quality · Value · Fast Delivery
            </span>

            <h1 className="text-5xl md:text-6xl font-bold mt-4 mb-5">
              Welcome to Nova<span className="text-brand-400">Cart</span>
            </h1>

            <p className="text-lg text-brand-50/80 max-w-2xl mx-auto mb-9">
              Discover the best products at the best prices.
            </p>

            <button className="btn btn-primary btn-lg">
              Shop Now
            </button>
          </div>
        </section>

        {/* Search */}
        <section className="max-w-7xl mx-auto px-6 mt-12">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field p-4 shadow-sm"
          />
        </section>

        {/* Category + Sorting */}
        <section className="max-w-7xl mx-auto px-6 mt-8">

          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {[
              "All",
              "Electronics",
              "Fashion",
              "Accessories",
              "Home",
            ].map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`chip ${
                  category === item ? "chip-active" : ""
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
              className="field w-auto px-4 py-2"
            >
              <option value="default">
                Sort By
              </option>

              <option value="low">
                Price: Low → High
              </option>

              <option value="high">
                Price: High → Low
              </option>

              <option value="az">
                Name: A → Z
              </option>

              <option value="za">
                Name: Z → A
              </option>

              <option value="rating">
                Top Rated
              </option>
            </select>
          </div>

        </section>

        {/* Featured Products */}

        <section className="max-w-7xl mx-auto py-12 px-6">

          <div className="text-center mb-10">
            <span className="eyebrow">Our Collection</span>
            <h2 className="section-title text-4xl mt-3">
              Featured Products
            </h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center text-muted-soft text-xl">
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {filteredProducts.map((product) => (
               <ProductCard
  key={product._id}
  id={product._id}
                  name={product.name}
                  price={product.price}
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
          )}

        </section>
                {/* Categories */}
        <section className="surface-muted py-16 border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <span className="eyebrow">Browse By</span>
              <h2 className="section-title text-4xl mt-3">
                Categories
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: "📱", label: "Electronics" },
                { icon: "👕", label: "Fashion" },
                { icon: "⌚", label: "Accessories" },
                { icon: "🏠", label: "Home" },
              ].map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setCategory(cat.label)}
                  className="card card-hover p-8 text-center"
                >
                  <div className="text-5xl">{cat.icon}</div>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {cat.label}
                  </h3>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}