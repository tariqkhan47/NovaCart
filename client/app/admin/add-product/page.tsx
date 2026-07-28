"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_NAMES } from "../../../lib/categories";

export default function AddProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [category, setCategory] = useState(CATEGORY_NAMES[0]);
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [detailHtml, setDetailHtml] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [stock, setStock] = useState("10");
  const [isFeatured, setIsFeatured] = useState(false);

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
      setCompareAtPrice("");
      setCategory("Home Decor");
      setImage("");
      setDescription("");
      setDetailHtml("");
      setSeoDescription("");
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
              Was Price <span className="text-muted-soft font-normal">(optional)</span>
            </label>

            <input
              type="number"
              min={0}
              placeholder="Leave blank if not on offer"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              className="field"
            />

            <p className="text-muted-soft text-sm mt-2">
              Shown crossed out beside the price. Only fill this in with a price
              this product was actually sold at — an invented one is a false
              discount claim.
            </p>
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
              {CATEGORY_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
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

          <div>
            <label className="block font-semibold mb-2">
              Full Description{" "}
              <span className="text-muted-soft font-normal">(optional)</span>
            </label>

            <textarea
              rows={10}
              placeholder="<p>The long write-up, with its photos…</p>"
              value={detailHtml}
              onChange={(e) => setDetailHtml(e.target.value)}
              className="field font-mono text-sm"
            />

            <p className="text-muted-soft text-sm mt-2">
              Shown further down the product page, below the price. HTML is
              allowed, but it is cleaned on save: scripts, links and styling are
              stripped, and only images served over https are kept. Leave blank
              to drop the section.
            </p>
          </div>

          <div>
            <label className="block font-semibold mb-2">
              SEO Description{" "}
              <span className="text-muted-soft font-normal">(optional)</span>
            </label>

            <textarea
              rows={3}
              maxLength={200}
              placeholder="The snippet Google shows under the link"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="field"
            />

            <p className="text-muted-soft text-sm mt-2">
              {seoDescription.length}/155 characters — anything past that is cut
              off in search results. Leave blank to build one from the
              product&apos;s own details.
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