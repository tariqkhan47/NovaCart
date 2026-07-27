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

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

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
        stock: 10,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("✅ Product Added Successfully!");

    setName("");
    setPrice("");
    setCategory("Electronics");
    setImage("");
    setDescription("");

    router.push("/");
  } catch (error) {
    console.error(error);
    alert("Something went wrong!");
  }
  };

  return (
    <main className="page py-10 px-6">
      <div className="max-w-3xl mx-auto panel p-8">

        <div className="text-center mb-8">
          <span className="eyebrow">Catalogue</span>
          <h1 className="text-4xl font-bold mt-3">
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

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
          >
            Save Product
          </button>

        </form>

      </div>
    </main>
  );
}