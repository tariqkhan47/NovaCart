import Link from "next/link";
import { products } from "../../../data/products";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductDetails({ params }: Props) {
  const { id } = await params;

  const product = products.find((p) => p.id === Number(id));

  if (!product) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h1 className="text-4xl font-bold">Product Not Found</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8 grid md:grid-cols-2 gap-10">

        <img
          src={product.image}
          alt={product.name}
          className="w-full h-96 object-cover rounded-xl"
        />

        <div>
          <h1 className="text-4xl font-bold">{product.name}</h1>

          <p className="text-yellow-500 text-xl mt-3">
            ⭐⭐⭐⭐⭐ (4.9)
          </p>

          <p className="text-3xl font-bold text-blue-600 mt-4">
            ${product.price}
          </p>

          <p className="text-gray-600 mt-6">
            {product.description}
          </p>

          <button className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-lg">
            Add to Cart
          </button>

          <Link href="/">
            <button className="ml-4 mt-8 border border-blue-600 text-blue-600 px-8 py-3 rounded-lg">
              Back
            </button>
          </Link>
        </div>

      </div>
    </main>
  );
}