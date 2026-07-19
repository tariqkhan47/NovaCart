"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useProducts } from "../../../context/ProductContext";

export default function EditProductPage() {
  const { products, updateProduct } = useProducts();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");

  function handleEdit(id: number) {
    const product = products.find((p) => p.id === id);

    if (!product) return;

    setSelectedId(product.id);
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    setImage(product.image);
    setDescription(product.description);
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();

    if (selectedId === null) return;

    updateProduct({
      id: selectedId,
      name,
      price: Number(price),
      category,
      image,
      description,
    });

    alert("✅ Product Updated Successfully!");
router.push("/admin");
    setSelectedId(null);
    setName("");
    setPrice("");
    setCategory("");
    setImage("");
    setDescription("");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold mb-8">
          ✏️ Edit Products
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-10">

          {products.map((product) => (
            <div
              key={product.id}
              className="flex justify-between items-center border-b py-4"
            >
              <div>
                <h2 className="font-bold">{product.name}</h2>
                <p>${product.price}</p>
              </div>

              <button
                onClick={() => handleEdit(product.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Edit
              </button>
            </div>
          ))}

        </div>

        {selectedId && (
          <form
            onSubmit={handleUpdate}
            className="bg-white rounded-xl shadow-lg p-8 space-y-5"
          >
            <h2 className="text-2xl font-bold">
              Update Product
            </h2>

            <input
              type="text"
              placeholder="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="text"
              placeholder="Image URL"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full border rounded-lg p-3"
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg p-3 h-32"
            />

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700"
            >
              Update Product
            </button>
          </form>
        )}

      </div>
    </main>
  );
}