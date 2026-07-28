"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "../../../lib/currency";

type Product = {
  _id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
};

export default function DeleteProductPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmDelete = window.confirm(
      `Delete "${name}" ?`
    );

    if (!confirmDelete) return;

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push("/admin/login");
          return;
        }

        setError(data.message || "Delete failed");
        return;
      }

      setSuccess(`"${name}" deleted.`);

      fetchProducts();
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    }
  }

  return (
    <main className="page p-4 sm:p-10">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8">
          🗑 Delete Products
        </h1>

        {error && (
          <div className="card p-4 mb-6 text-danger">{error}</div>
        )}

        {success && (
          <div className="card p-4 mb-6 text-success">✅ {success}</div>
        )}

        {products.length === 0 ? (
          <p className="text-center text-muted-soft text-xl">
            No Products Available
          </p>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="card flex flex-wrap justify-between items-center gap-3 p-4"
              >
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold break-words">
                    {product.name}
                  </h2>

                  <p className="price">
                    {formatPrice(product.price)}
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleDelete(product._id, product.name)
                  }
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}