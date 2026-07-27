"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  _id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
};

export default function EditProductPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] =
    useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  }

  function handleEdit(product: Product) {
    setSelectedProduct(product);

    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    setImage(product.image);
    setDescription(product.description);
  }

  async function handleUpdate(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!selectedProduct) return;

    const res = await fetch(
      `/api/products/${selectedProduct._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name,
          price: Number(price),
          category,
          image,
          description,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("✅ Product Updated!");

    fetchProducts();

    setSelectedProduct(null);

    router.refresh();
  }

  return (
    <main className="page py-12 px-6">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold mb-8">
          ✏️ Edit Products
        </h1>

        <div className="panel p-6 mb-10">

          {products.map((product) => (
            <div
              key={product._id}
              className="flex justify-between items-center border-b divider py-4"
            >
              <div>
                <h2 className="font-bold">
                  {product.name}
                </h2>

                <p className="price">${product.price}</p>
              </div>

              <button
                onClick={() =>
                  handleEdit(product)
                }
                className="btn btn-outline btn-sm"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
                {selectedProduct && (
          <form
            onSubmit={handleUpdate}
            className="panel p-8 space-y-5"
          >
            <h2 className="text-2xl font-bold">
              Update Product
            </h2>

            <input
              type="text"
              placeholder="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
            />

            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="field"
            />

            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field"
            />

            <input
              type="text"
              placeholder="Image URL"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="field"
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field h-32"
            />

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
            >
              Update Product
            </button>
          </form>
        )}

      </div>
    </main>
  );
}