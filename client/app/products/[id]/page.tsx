"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { slugifyCategory } from "../../../lib/categories";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { useCart } from "../../../context/CartContext";
import { formatPrice } from "../../../lib/currency";
import ProductReviews from "../../../components/ProductReviews";

type Product = {
  _id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  stock: number;
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

                <p className="price text-2xl sm:text-3xl mt-4">
                  {formatPrice(product.price)}
                </p>

                <p className="text-muted-soft mt-4">{product.description}</p>

                <p className="text-sm text-muted-soft mt-3">
                  {product.stock > 0
                    ? `${product.stock} in stock`
                    : "Out of stock"}
                </p>

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
                  className="btn btn-primary btn-block btn-lg mt-7"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          )}

          {product && <ProductReviews productId={product._id} />}
        </div>
      </main>

      <Footer />
    </>
  );
}
