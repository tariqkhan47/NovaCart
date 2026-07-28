"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "../../../lib/currency";
import { CATEGORY_NAMES } from "../../../lib/categories";

type Product = {
  _id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  stock: number;
  featured?: boolean;
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
  const [stock, setStock] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setStock(String(product.stock ?? 0));
    setIsFeatured(Boolean(product.featured));
    setError("");
    setSuccess("");
  }

  async function handleUpdate(
    e: React.FormEvent
  ) {
    e.preventDefault();
    setError("");
    setSuccess("");

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
          stock: Number(stock),
          featured: isFeatured,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        router.push("/admin/login");
        return;
      }

      setError(data.message ?? "Could not update the product.");
      return;
    }

    setSuccess(`"${data.name}" updated.`);

    fetchProducts();

    setSelectedProduct(null);

    router.refresh();
  }

  return (
    <main className="page py-12 px-4 sm:px-6">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl sm:text-4xl font-bold mb-8">
          ✏️ Edit Products
        </h1>

        {success && (
          <div className="card p-4 mb-6 text-success">✅ {success}</div>
        )}

        <div className="panel p-4 sm:p-6 mb-10">

          {products.map((product) => (
            <div
              key={product._id}
              className="flex flex-wrap justify-between items-center gap-3 border-b divider py-4"
            >
              <div className="min-w-0">
                <h2 className="font-bold break-words">
                  {product.name}
                </h2>

                <p className="price">{formatPrice(product.price)}</p>
                <p className="text-muted-soft text-sm">
                  {product.stock ?? 0} in stock
                </p>
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
            className="panel p-5 sm:p-8 space-y-5"
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

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field"
            >
              {/* A product left on a retired collection keeps its own option,
                  so opening the form does not quietly re-file it. */}
              {!CATEGORY_NAMES.includes(category) && (
                <option value={category}>{category} (uncategorized)</option>
              )}

              {CATEGORY_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Image URL"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="field"
            />

            <input
              type="number"
              min={0}
              placeholder="Stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="field"
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field h-32"
            />

            <label className="flex items-center gap-3 font-semibold">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4"
              />
              Show in Featured Products on the home page
            </label>

            {error && (
              <p className="text-danger text-sm text-center">{error}</p>
            )}

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