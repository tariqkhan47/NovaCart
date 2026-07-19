"use client";

import { useProducts } from "../../../context/ProductContext";

export default function DeleteProductPage() {
  const { products, deleteProduct } = useProducts();

  return (
    <main className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-4xl font-bold text-center mb-8">
          🗑 Delete Products
        </h1>

        {products.length === 0 ? (
          <p className="text-center text-gray-500 text-xl">
            No Products Available
          </p>
        ) : (
          <div className="space-y-4">

            {products.map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center border rounded-lg p-4"
              >
                <div>
                  <h2 className="text-xl font-bold">
                    {product.name}
                  </h2>

                  <p className="text-gray-500">
                    ${product.price}
                  </p>
                </div>

                <button
                  onClick={() => {
                    const confirmDelete = confirm(
                      `Delete "${product.name}" ?`
                    );

                    if (confirmDelete) {
  deleteProduct(product.id);
  alert("✅ Product Deleted Successfully!");
}
                  }}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
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