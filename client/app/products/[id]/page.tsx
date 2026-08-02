"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { slugifyCategory } from "../../../lib/categories";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import BagIcon from "../../../components/BagIcon";
import { useCart } from "../../../context/CartContext";
import PriceTag from "../../../components/PriceTag";
import RatingScore from "../../../components/RatingScore";
import ProductReviews from "../../../components/ProductReviews";
import { trackTikTok } from "../../../lib/tiktok";

type Product = {
  _id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  image: string;
  description: string;
  detailHtml?: string;
  stock: number;
  rating: number | null;
  reviewCount: number;
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { cart, addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);

        if (!res.ok) {
          setError("Product not found");
          return;
        }

        const data = await res.json();
        setProduct(data);

        // After the fetch, not on mount: the price and name are what make
        // this event worth anything to TikTok, and neither exists until the
        // product has actually arrived.
        trackTikTok("ViewContent", {
          content_id: data._id,
          content_name: data.name,
          content_type: "product",
          price: data.price,
          value: data.price,
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  return (
    <>
      <Navbar cart={cart.length} />

      <main className="page py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <p className="text-center text-muted-soft text-xl">Loading...</p>
          ) : error || !product ? (
            <div className="text-center">
              <p className="text-xl text-muted-soft mb-4">
                {error || "Product not found"}
              </p>
              <button
                onClick={() => router.push("/")}
                className="btn btn-primary"
              >
                Back to Home
              </button>
            </div>
          ) : (
            <div className="panel p-5 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="overflow-hidden rounded-2xl surface-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-64 sm:h-96 object-cover"
                  loading="lazy"
                />
              </div>

              <div className="min-w-0">
                <Link
                  href={`/category/${slugifyCategory(product.category)}`}
                  className="badge"
                >
                  {product.category}
                </Link>

                <h1 className="text-2xl sm:text-3xl font-bold mt-4 break-words">
                  {product.name}
                </h1>

                <PriceTag
                  price={product.price}
                  compareAtPrice={product.compareAtPrice}
                  size="lg"
                  className="mt-4"
                />

                {/* Under the price, where a shopper looks next once they know
                    what it costs. Links down to the reviews it came from, and
                    the whole row is dropped until there are some. */}
                {product.reviewCount > 0 && product.rating && (
                  <a
                    href="#reviews"
                    className="mt-3 block w-fit rounded-lg transition hover:opacity-80"
                  >
                    <RatingScore
                      rating={product.rating}
                      reviewCount={product.reviewCount}
                      size="lg"
                    />
                  </a>
                )}

                <p className="text-muted-soft mt-4">{product.description}</p>

                <p className="text-sm text-muted-soft mt-3">
                  {product.stock > 0
                    ? `${product.stock} in stock`
                    : "Out of stock"}
                </p>

                {/* Add to Cart no longer runs the full width: it shares the
                    row so that "Buy it now" can sit under it as the wider,
                    heavier control. Someone who already knows they want this
                    should not have to find the cart first. */}
                <div className="mt-7 flex flex-col gap-3">
                  <button
                    onClick={() =>
                      addToCart({
                        id: product._id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                      })
                    }
                    disabled={product.stock <= 0}
                    className="btn btn-cart btn-sm sm:w-auto sm:self-start sm:px-8"
                  >
                    <BagIcon />
                    Add to Cart
                  </button>

                  {/* Adds and goes, in that order — checkout reads the cart,
                      so pushing first would arrive at an empty one. Nothing
                      here asks who they are; the checkout screen takes guests
                      now, and a login wall is where a phone customer leaves. */}
                  <button
                    onClick={() => {
                      addToCart({
                        id: product._id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                      });
                      router.push("/checkout");
                    }}
                    disabled={product.stock <= 0}
                    className="btn btn-primary btn-lg w-full"
                  >
                    Buy it now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* The supplier's full write-up, with the feature photos that came
              with it. Dropped entirely for products that have not been through
              the description import, rather than showing an empty heading.

              Safe to inject: detailHtml is sanitized by lib/rich-text.mjs on
              the way into the database, so what is stored is already stripped
              of scripts, event handlers and every attribute bar an image's
              src and alt. Nothing here trusts markup that arrives at render
              time. */}
          {product?.detailHtml && (
            <section className="panel p-5 sm:p-8 mt-8">
              <h2 className="section-title text-xl sm:text-2xl mb-5">
                Product Details
              </h2>

              <div
                className="rich-text"
                dangerouslySetInnerHTML={{ __html: product.detailHtml }}
              />
            </section>
          )}

          {product && (
            <div id="reviews" className="scroll-mt-24">
              <ProductReviews productId={product._id} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
