import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";
import { normalizeComparePrice } from "@/lib/seo";
import { normalizeDetailHtml } from "@/lib/rich-text.mjs";

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

    const {
      name,
      price,
      compareAtPrice,
      category,
      image,
      description,
      detailHtml,
      seoDescription,
      stock,
      featured,
    } = await req.json();

    // Only accept known fields, so a caller cannot inject their own.
    const product = await Product.create({
      name,
      price,
      // Dropped unless it is genuinely above the selling price — see lib/seo.ts.
      compareAtPrice: normalizeComparePrice(compareAtPrice, price),
      category,
      image,
      description,
      // Cleaned here rather than at render time, so nothing reaches the
      // database with a script in it — see lib/rich-text.mjs.
      detailHtml: normalizeDetailHtml(detailHtml),
      seoDescription: seoDescription?.trim() || undefined,
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