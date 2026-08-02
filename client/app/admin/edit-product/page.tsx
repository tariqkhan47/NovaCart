"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "../../../lib/currency";
import { CATEGORY_NAMES } from "../../../lib/categories";
import { ADMIN_LIST_LIMIT, searchProducts } from "../../../lib/product-search";

type Product = {
  _id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  image: string;
  description: string;
  detailHtml?: string;
  seoDescription?: string;
  stock: number;
  featured?: boolean;
};

export default function EditProductPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [query, setQuery] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] =
    useState("");
  const [detailHtml, setDetailHtml] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
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
    setCompareAtPrice(product.compareAtPrice?.toString() ?? "");
    setCategory(product.category);
    setImage(product.image);
    setDescription(product.description);
    setDetailHtml(product.detailHtml ?? "");
    setSeoDescription(product.seoDescription ?? "");
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
          // Left blank means no crossed-out price; the API drops anything that
          // is not genuinely above the selling price.
          compareAtPrice: compareAtPrice === "" ? null : Number(compareAtPrice),
          category,
          image,
          description,
          detailHtml,
          seoDescription,
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

  const matches = useMemo(
    () => searchProducts(products, query),
    [products, query]
  );

  // Rendering all 502 rows is the other half of why this screen was slow —
  // it is a lot of DOM to build before anything can be clicked. A search that
  // has not narrowed things down yet does not need to show everything.
  const shown = matches.slice(0, ADMIN_LIST_LIMIT);

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

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Search by name or collection…"
            autoFocus
            className="field mb-4"
          />

          <p className="text-muted-soft text-sm mb-4">
            {query
              ? `${matches.length} of ${products.length} products`
              : `${products.length} products`}
            {matches.length > shown.length &&
              ` — showing the first ${shown.length}, keep typing to narrow it down`}
          </p>

          {matches.length === 0 && (
            <p className="py-6 text-center text-muted-soft">
              Nothing matches “{query}”.
            </p>
          )}

          {shown.map((product) => (
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

            <div>
              <input
                type="number"
                min={0}
                placeholder="Was price (optional)"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                className="field"
              />

              <p className="text-muted-soft text-sm mt-2">
                Shown crossed out beside the price. Only fill this in with a
                price this product was actually sold at — an invented one is a
                false discount claim. Leave blank for no offer.
              </p>
            </div>

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

            <div>
              <textarea
                placeholder="Full description, HTML (optional)"
                value={detailHtml}
                onChange={(e) => setDetailHtml(e.target.value)}
                className="field h-48 font-mono text-sm"
              />

              <p className="text-muted-soft text-sm mt-2">
                The long write-up shown further down the product page, with its
                photos. Imported from the supplier by{" "}
                <code>scripts/hhc-details.mjs</code>. HTML is allowed, but it is
                cleaned on save: scripts, links and styling are stripped, and
                only images served over https are kept. Leave blank to drop the
                section.
              </p>
            </div>

            <div>
              <textarea
                placeholder="SEO description (optional)"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                maxLength={200}
                className="field h-24"
              />

              <p className="text-muted-soft text-sm mt-2">
                The snippet under the link in Google. {seoDescription.length}/155
                characters — anything past that is cut off. Leave blank to build
                one from the product&apos;s own details.
              </p>
            </div>

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