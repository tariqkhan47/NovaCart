"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Stars from "./Stars";

type Review = {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export default function ProductReviews({
  productId,
}: {
  productId: string;
}) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (res.ok) setReviews(await res.json());
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const average =
    reviews.length === 0
      ? 0
      : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const alreadyReviewed = reviews.some((r) => r.name === user?.name);

  async function submitReview() {
    setError("");

    if (!comment.trim()) {
      setError("Please write something in your review.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Could not save your review.");
        return;
      }

      setComment("");
      setRating(5);
      await load();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel p-8 mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="section-title text-2xl">Customer Reviews</h2>

        {reviews.length > 0 && (
          <div className="text-right">
            <Stars rating={average} className="text-xl" />
            <p className="text-muted-soft text-sm mt-1">
              {average.toFixed(1)} out of 5 · {reviews.length}{" "}
              {reviews.length === 1 ? "review" : "reviews"}
            </p>
          </div>
        )}
      </div>

      {/* Write a review */}
      {!user ? (
        <div className="card p-5 mb-8 text-center">
          <p className="text-muted-soft">
            <Link href="/login" className="link-brand">
              Log in
            </Link>{" "}
            to write a review.
          </p>
        </div>
      ) : alreadyReviewed ? (
        <div className="card p-5 mb-8 text-center text-muted-soft">
          You have already reviewed this product.
        </div>
      ) : (
        <div className="card p-5 mb-8 space-y-4">
          <p className="font-semibold">
            Reviewing as {user.name}
          </p>

          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="field"
          >
            <option value={5}>★★★★★ — Excellent</option>
            <option value={4}>★★★★ — Good</option>
            <option value={3}>★★★ — Average</option>
            <option value={2}>★★ — Poor</option>
            <option value={1}>★ — Terrible</option>
          </select>

          <textarea
            placeholder="How was the product?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            className="field h-28"
          />

          {error && <p className="text-danger text-sm">{error}</p>}

          <button
            onClick={submitReview}
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? "Saving..." : "Submit Review"}
          </button>
        </div>
      )}

      {/* Existing reviews */}
      {loading ? (
        <p className="text-muted-soft">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted-soft">
          No reviews yet — be the first to review this product.
        </p>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <div key={review._id} className="border-t divider pt-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold">{review.name}</h3>

                <span className="text-muted-soft text-sm">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>

              <Stars rating={review.rating} />

              <p className="mt-2 text-muted-soft">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
