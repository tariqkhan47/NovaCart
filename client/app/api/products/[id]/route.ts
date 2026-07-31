import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { normalizeComparePrice } from "@/lib/seo";
import { normalizeDetailHtml } from "@/lib/rich-text.mjs";
import { parseId } from "@/lib/ids";
import { serializeProduct } from "@/lib/serialize";

// GET Single Product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseId(id);

    if (productId === null) {
      return NextResponse.json(
        { message: "Invalid Product ID" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Same shape the list endpoint returns, so the detail page can show the
    // rating widget without a second round trip for the reviews.
    const rating = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return NextResponse.json(
      serializeProduct({
        ...product,
        rating: rating._avg.rating,
        reviewCount: rating._count.rating,
      })
    );
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

    const { id } = await params;
    const productId = parseId(id);

    if (productId === null) {
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

    try {
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          name,
          price,
          // An empty box on the form clears the crossed-out price rather than
          // storing a 0, which would read as a 100% discount. Explicit null
          // (rather than undefined) so the update actually clears it.
          compareAtPrice: normalizeComparePrice(compareAtPrice, price) ?? null,
          category,
          image,
          description,
          // Cleaned here rather than at render time, so nothing reaches the
          // database with a script in it — see lib/rich-text.mjs.
          detailHtml: normalizeDetailHtml(detailHtml),
          seoDescription: seoDescription?.trim() || null,
          stock,
          featured: Boolean(featured),
        },
      });

      return NextResponse.json(serializeProduct(updatedProduct));
    } catch (error) {
      if (
        (error as { code?: string }).code === "P2025" // record to update not found
      ) {
        return NextResponse.json(
          { message: "Product not found" },
          { status: 404 }
        );
      }

      throw error;
    }
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

    const { id } = await params;
    const productId = parseId(id);

    if (productId === null) {
      return NextResponse.json(
        { message: "Invalid Product ID" },
        { status: 400 }
      );
    }

    try {
      await prisma.product.delete({ where: { id: productId } });
    } catch (error) {
      if ((error as { code?: string }).code === "P2025") {
        return NextResponse.json(
          { message: "Product not found" },
          { status: 404 }
        );
      }

      throw error;
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
