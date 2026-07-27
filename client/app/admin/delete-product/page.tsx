"use client";

import { useEffect, useState } from "react";

type Product = {
  _id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
};

export default function DeleteProductPage() {
  const [products, setProducts] = useState<Product[]>([]);

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

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Delete Failed");
        return;
      }

      alert("✅ Product Deleted Successfully!");

      fetchProducts();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  }

  return (
    <main className="page p-10">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl font-bold text-center mb-8">
          🗑 Delete Products
        </h1>

        {products.length === 0 ? (
          <p className="text-center text-muted-soft text-xl">
            No Products Available
          </p>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="card flex justify-between items-center p-4"
              >
                <div>
                  <h2 className="text-xl font-bold">
                    {product.name}
                  </h2>

                  <p className="price">
                    ${product.price}
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