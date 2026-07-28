"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("10");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          price: Number(price),
          category,
          image,
          description,
          stock: Number(stock),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // The session may have expired while the form was open.
        if (res.status === 401 || res.status === 403) {
          router.push("/admin/login");
          return;
        }

        setError(data.message ?? "Could not save the product.");
        return;
      }

      setSuccess(`"${data.name}" added.`);

      setName("");
      setPrice("");
      setCategory("Electronics");
      setImage("");
      setDescription("");
      setStock("10");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto panel p-5 sm:p-8">

        <div className="text-center mb-8">
          <span className="eyebrow">Catalogue</span>
          <h1 className="text-3xl sm:text-4xl font-bold mt-3">
            ➕ Add New Product
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block font-semibold mb-2">
              Product Name
            </label>

            <input
              type="text"
              placeholder="Enter product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Price
            </label>

            <input
              type="number"
              placeholder="Enter price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="field"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Category
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field"
            >
              <option>Electronics</option>
              <option>Fashion</option>
              <option>Accessories</option>
              <option>Home</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Image URL
            </label>

            <input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="field"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Stock
            </label>

            <input
              type="number"
              min={0}
              placeholder="Units available"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="field"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Description
            </label>

            <textarea
              rows={4}
              placeholder="Enter product description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field"
              required
            />
          </div>

          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          {success && (
            <p className="text-success text-sm text-center">✅ {success}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-block btn-lg"
          >
            {submitting ? "Saving..." : "Save Product"}
          </button>

        </form>

      </div>
    </main>
  );
}