import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";

// GET ALL PRODUCTS, each with its average rating and review count.
// Done as one aggregation rather than a query per product.
export async function GET() {
  try {
    await connectDB();

    const products = await Product.aggregate([
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "product",
          as: "reviews",
        },
      },
      {
        $addFields: {
          // null when a product has no reviews yet
          rating: { $avg: "$reviews.rating" },
          reviewCount: { $size: "$reviews" },
        },
      },
      { $project: { reviews: 0 } },
      { $sort: { createdAt: -1 } },
    ]);

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}

// ADD PRODUCT (admin only)
export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin(req);
    if (guard instanceof NextResponse) return guard;

    await connectDB();

    const { name, price, category, image, description, stock } =
      await req.json();

    // Only accept known fields, so a caller cannot inject their own.
    const product = await Product.create({
      name,
      price,
      category,
      image,
      description,
      stock,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST PRODUCT ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}