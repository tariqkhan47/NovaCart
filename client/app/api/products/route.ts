import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";

// GET ALL PRODUCTS, each with its average rating and review count.
// Done as one aggregation rather than a query per product.
//
// ?category=Home Decor narrows it to one collection, so a category page does
// not have to pull the whole catalog down and filter in the browser.
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const category = req.nextUrl.searchParams.get("category");
    const featuredOnly = req.nextUrl.searchParams.get("featured") === "true";

    const match: Record<string, unknown> = {};
    if (category) match.category = category;
    if (featuredOnly) match.featured = true;

    const products = await Product.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
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

    const { name, price, category, image, description, stock, featured } =
      await req.json();

    // Only accept known fields, so a caller cannot inject their own.
    const product = await Product.create({
      name,
      price,
      category,
      image,
      description,
      stock,
      featured: Boolean(featured),
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