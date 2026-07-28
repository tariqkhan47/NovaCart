"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Stars from "../../components/Stars";

type Review = {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
  product: {
    _id: string;
    name: string;
    image?: string;
  } | null;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/reviews")
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load reviews");
        return res.json();
      })
      .then(setReviews)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-10">
          <span className="eyebrow">What Shoppers Say</span>
          <h1 className="text-3xl sm:text-4xl font-bold mt-3">
            ⭐ Customer Reviews
          </h1>
          <p className="text-muted-soft mt-3">
            Reviews are written on each product&apos;s page.
          </p>
        </div>

        {loading ? (
          <div className="panel p-5 sm:p-8 text-center text-muted-soft text-xl">
            Loading...
          </div>
        ) : error ? (
          <div className="panel p-5 sm:p-8 text-center text-danger text-xl">
            {error}
          </div>
        ) : reviews.length === 0 ? (
          <div className="panel p-6 sm:p-10 text-center">
            <p className="text-muted-soft text-xl mb-6">
              No reviews yet.
            </p>

            <Link href="/">
              <button className="btn btn-primary btn-lg">
                Browse Products
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {reviews.map((review) => (
              <div key={review._id} className="card p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold break-words">{review.name}</h2>
                    <Stars rating={review.rating} />
                  </div>

                  {review.product && (
                    <Link
                      href={`/products/${review.product._id}`}
                      className="flex items-center gap-3 link-brand min-w-0"
                    >
                      {review.product.image && (
                        <img
                          src={review.product.image}
                          alt={review.product.name}
                          loading="lazy"
                          className="w-12 h-12 shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <span className="text-sm break-words">
                        {review.product.name}
                      </span>
                    </Link>
                  )}
                </div>

                <p className="mt-3 text-muted-soft break-words">{review.comment}</p>

                <p className="text-muted-soft text-xs mt-3">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
