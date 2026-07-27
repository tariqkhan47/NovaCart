"use client";

import { useState } from "react";

type Review = {
  id: number;
  name: string;
  rating: number;
  comment: string;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 1,
      name: "Ali",
      rating: 5,
      comment: "Amazing product. Highly recommended!",
    },
    {
      id: 2,
      name: "Ahmed",
      rating: 4,
      comment: "Very good quality and fast delivery.",
    },
  ]);

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  function addReview() {
    if (!name || !comment) {
      alert("Please fill all fields.");
      return;
    }

    const newReview: Review = {
      id: Date.now(),
      name,
      rating,
      comment,
    };

    setReviews([newReview, ...reviews]);

    setName("");
    setRating(5);
    setComment("");
  }

  return (
    <main className="page py-10 px-6">
      <div className="max-w-4xl mx-auto panel p-8">

        <h1 className="text-4xl font-bold mb-8">
          ⭐ Product Reviews
        </h1>

        <div className="space-y-4 mb-10">

          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
          />

          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="field"
          >
            <option value={5}>⭐⭐⭐⭐⭐</option>
            <option value={4}>⭐⭐⭐⭐</option>
            <option value={3}>⭐⭐⭐</option>
            <option value={2}>⭐⭐</option>
            <option value={1}>⭐</option>
          </select>

          <textarea
            placeholder="Write your review..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="field h-32"
          />

          <button
            onClick={addReview}
            className="btn btn-primary"
          >
            Submit Review
          </button>

        </div>

        <div className="space-y-6">

          {reviews.map((review) => (
            <div
              key={review.id}
              className="card p-5"
            >
              <h2 className="text-xl font-bold">
                {review.name}
              </h2>

              <p className="text-brand-500 text-lg">
                {"⭐".repeat(review.rating)}
              </p>

              <p className="mt-3 text-muted-soft">
                {review.comment}
              </p>
            </div>
          ))}

        </div>

      </div>
    </main>
  );
}