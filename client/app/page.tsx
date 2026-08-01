"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import HeroMarquee from "../components/HeroMarquee";
import Footer from "../components/Footer";
import { CATEGORIES } from "../lib/categories";

/**
 * Deals one product from each collection in turn.
 *
 * The catalog was seeded collection by collection, so plain newest-first puts
 * all 32 watches ahead of everything else and the first screenful looks like a
 * watch shop. Round-robin instead: the first row of cards is one product per
 * collection, the next row is the second from each, and so on.
 */
function interleaveByCategory(list: any[]) {
  const buckets = new Map<string, any[]>();

  for (const product of list) {
    const bucket = buckets.get(product.category);

    if (bucket) {
      bucket.push(product);
    } else {
      buckets.set(product.category, [product]);
    }
  }

  // Deal in the order the collections are listed, so the run starts at Home
  // Decor rather than wherever the newest product happened to land. Anything
  // on a retired collection sorts to the back instead of jumping the queue.
  const rank = (name: string) => {
    const index = CATEGORIES.findIndex((item) => item.name === name);
    return index === -1 ? CATEGORIES.length : index;
  };

  const dealt: any[] = [];
  const rows = [...buckets.entries()].sort(
    (a, b) => rank(a[0]) - rank(b[0])
  );

  for (let round = 0; dealt.length < list.length; round++) {
    for (const [, bucket] of rows) {
      if (round < bucket.length) dealt.push(bucket[round]);
    }
  }

  return dealt;
}

export default function Home() {
const { cart, addToCart } = useCart();
const [products, setProducts] = useState<any[]>([]);
const [featured, setFeatured] = useState<any[]>([]);

useEffect(() => {
  fetchProducts();
  fetchFeatured();
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

// The admin's hand-picked row, one product per collection.
const fetchFeatured = async () => {
  try {
    const res = await fetch("/api/products?featured=true");
    const data = await res.json();
    setFeatured(interleaveByCategory(Array.isArray(data) ? data : []));
  } catch (error) {
    console.error(error);
  }
};
const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");

  // The catalog runs to a few hundred products, so show a screenful at a time
  // instead of making every phone download every image up front.
  const PAGE_SIZE = 24;
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Every filter change makes a fresh list, so it starts from the top again.
  const showFirstPage = () => setVisible(PAGE_SIZE);

  const matchingProducts = products
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

  // An explicit sort is the shopper's own order, so leave it alone; only the
  // unsorted default gets spread across the collections.
  const filteredProducts =
    sortBy === "default"
      ? interleaveByCategory(matchingProducts)
      : matchingProducts;

  // Photos for the hero's drifting wall. The featured row first, because those
  // are already being downloaded for the cards below and are one per
  // collection, so the strip shows the breadth of the shop rather than twelve
  // variations on a wall clock. Falls back to the head of the catalog on a
  // shop where nothing has been featured yet, and takes the interleaved order
  // there for the same reason.
  const heroImages = (featured.length > 0 ? featured : filteredProducts)
    .slice(0, 14)
    .map((product) => product.image)
    .filter(Boolean);

  return (
  
    <>
      <Navbar cart={cart.length} />

      <main className="page">

        {/* Hero Section */}
        {/* Kept shorter than it was: the nav now takes two rows, and between
            them the "Shop Now" button was being pushed under the fold on a
            laptop — the one thing on this screen that has to be visible
            without scrolling. */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="hero py-12 sm:py-16 px-6 sm:px-10">
            <div className="hero-pattern" />

            {/* The shop's own stock drifting behind the copy. Fed the featured
                products because those are the photos the cards further down
                load anyway, so the strip adds no download of its own — and it
                renders nothing until they have arrived, which is why the hero
                still looks right on the first paint. */}
            <HeroMarquee images={heroImages} />
            <div className="hero-veil" />

            <div className="relative text-center">
              <span className="eyebrow">
                Quality · Value · Fast Delivery
              </span>

              {/* One line from sm up, where it comfortably fits. Left to wrap
                  on a phone, where 36px type across eighteen characters does
                  not fit a 360px screen and forcing it would push the heading
                  off the side; there it breaks before the name rather than
                  inside it. */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mt-3 mb-4 sm:whitespace-nowrap">
                Welcome to Arsalah
              </h1>

              <p className="text-base sm:text-lg text-muted-soft max-w-2xl mx-auto mb-7">
                Discover the best products at the best prices.
              </p>

              <button className="btn btn-primary btn-lg">
                Shop Now
              </button>
            </div>
          </div>
        </section>

        {/* Featured Products — the hand-picked row, one per collection. */}
        {featured.length > 0 && (
          <section className="max-w-7xl mx-auto pt-14 px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="eyebrow">Handpicked</span>

              <h2 className="section-title text-3xl sm:text-4xl mt-3">
                Featured Products
              </h2>

              <p className="text-muted-soft mt-3">
                One standout pick from every collection.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
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
          </section>
        )}

        {/* Search */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              showFirstPage();
            }}
            className="field p-4 shadow-sm"
          />
        </section>

        {/* Category + Sorting */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">

          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6">
            {["All", ...CATEGORIES.map((item) => item.name)].map((item) => (
              <button
                key={item}
                onClick={() => {
                  setCategory(item);
                  showFirstPage();
                }}
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
              onChange={(e) => {
                setSortBy(e.target.value);
                showFirstPage();
              }}
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

        <section id="products" className="max-w-7xl mx-auto py-12 px-4 sm:px-6">

          <div className="text-center mb-10">
            <span className="eyebrow">Our Collection</span>
            <h2 className="section-title text-3xl sm:text-4xl mt-3">
              All Products
            </h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center text-muted-soft text-xl">
              No products found.
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
                {/* Categories */}
        <section className="surface-muted py-16 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="eyebrow">Browse By</span>
              <h2 className="section-title text-3xl sm:text-4xl mt-3">
                Categories
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="card card-hover p-6 sm:p-8 text-center"
                >
                  <div className="text-4xl sm:text-5xl">{cat.icon}</div>

                  <h3 className="mt-4 font-semibold text-foreground">
                    {cat.name}
                  </h3>

                  <p className="mt-2 text-sm text-muted-soft">
                    {cat.tagline}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}