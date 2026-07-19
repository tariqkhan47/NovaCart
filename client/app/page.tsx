"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import { useProducts } from "../context/ProductContext";
export default function Home() {
const { cart, addToCart } = useCart();
const { products } = useProducts();
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

        default:
          return 0;
      }
    });

  return (
  
    <>
      <Navbar cart={cart.length} />

      <main className="min-h-screen bg-gray-100">

        {/* Hero Section */}
        <section className="bg-blue-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-5xl font-bold mb-4">
              Welcome to NovaCart
            </h1>

            <p className="text-lg mb-8">
              Discover the best products at the best prices.
            </p>

            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold">
              Shop Now
            </button>
          </div>
        </section>

        {/* Search */}
        <section className="max-w-7xl mx-auto px-6 mt-10">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-4 border rounded-lg shadow"
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
                className={`px-5 py-2 rounded-lg font-semibold transition ${
                  category === item
                    ? "bg-blue-600 text-white"
                    : "bg-white border hover:bg-blue-100"
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
              className="border rounded-lg px-4 py-2 shadow"
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
            </select>
          </div>

        </section>

        {/* Featured Products */}

        <section className="max-w-7xl mx-auto py-12 px-6">

          <h2 className="text-3xl font-bold text-center mb-10">
            Featured Products
          </h2>

          {filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 text-xl">
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={`$${product.price}`}
                  image={product.image}
                  onAddToCart={() =>
                    addToCart({
                      id: product.id,
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
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-10">
              Categories
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white shadow-lg rounded-xl p-6 text-center">
                <div className="text-5xl">📱</div>
                <h3 className="mt-3 font-semibold">
                  Electronics
                </h3>
              </div>

              <div className="bg-white shadow-lg rounded-xl p-6 text-center">
                <div className="text-5xl">👕</div>
                <h3 className="mt-3 font-semibold">
                  Fashion
                </h3>
              </div>

              <div className="bg-white shadow-lg rounded-xl p-6 text-center">
                <div className="text-5xl">⌚</div>
                <h3 className="mt-3 font-semibold">
                  Accessories
                </h3>
              </div>

              <div className="bg-white shadow-lg rounded-xl p-6 text-center">
                <div className="text-5xl">🏠</div>
                <h3 className="mt-3 font-semibold">
                  Home
                </h3>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}