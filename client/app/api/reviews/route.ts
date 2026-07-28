import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";
import { requireUser } from "@/lib/auth";

// LIST REVIEWS — all recent, or just one product's with ?productId=
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const productId = req.nextUrl.searchParams.get("productId");

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return NextResponse.json(
          { message: "Invalid Product ID" },
          { status: 400 }
        );
      }

      const reviews = await Review.find({ product: productId }).sort({
        createdAt: -1,
      });

      return NextResponse.json(reviews);
    }

    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("product", "name image");

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}

// WRITE A REVIEW (must be logged in)
export async function POST(req: NextRequest) {
  try {
    const session = await requireUser(req);
    if (session instanceof NextResponse) return session;

    await connectDB();

    const { productId, rating, comment } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid Product ID" },
        { status: 400 }
      );
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return NextResponse.json(
        { message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!comment || !String(comment).trim()) {
      return NextResponse.json(
        { message: "Please write something in your review" },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // The name comes from the session, never from the request body, so a
    // reviewer cannot post under someone else's name.
    const review = await Review.create({
      product: productId,
      user: session.userId,
      name: session.name,
      rating: numericRating,
      comment: String(comment).trim(),
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    // Unique index on (product, user)
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { message: "You have already reviewed this product" },
        { status: 409 }
      );
    }

    console.error("CREATE REVIEW ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}
