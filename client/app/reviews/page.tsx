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
    <main className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-4xl font-bold mb-8">
          ⭐ Product Reviews
        </h1>

        <div className="space-y-4 mb-10">

          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full border rounded-lg p-3"
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
            className="w-full border rounded-lg p-3 h-32"
          />

          <button
            onClick={addReview}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Submit Review
          </button>

        </div>

        <div className="space-y-6">

          {reviews.map((review) => (
            <div
              key={review.id}
              className="border rounded-lg p-5"
            >
              <h2 className="text-xl font-bold">
                {review.name}
              </h2>

              <p className="text-yellow-500 text-lg">
                {"⭐".repeat(review.rating)}
              </p>

              <p className="mt-3 text-gray-600">
                {review.comment}
              </p>
            </div>
          ))}

        </div>

      </div>
    </main>
  );
}