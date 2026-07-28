import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";
import { normalizeComparePrice } from "@/lib/seo";
import { normalizeDetailHtml } from "@/lib/rich-text.mjs";

// GET Single Product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid Product ID" },
        { status: 400 }
      );
    }

    // Same shape the list endpoint returns, so the detail page can show the
    // rating widget without a second round trip for the reviews.
    const [product] = await Product.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
    ]);

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}

// UPDATE Product (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin(req);
    if (guard instanceof NextResponse) return guard;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid Product ID" },
        { status: 400 }
      );
    }

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

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price,
        // An empty box on the form clears the crossed-out price rather than
        // storing a 0, which would read as a 100% discount.
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
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProduct) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProduct);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}

// DELETE Product (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin(req);
    if (guard instanceof NextResponse) return guard;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid Product ID" },
        { status: 400 }
      );
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}