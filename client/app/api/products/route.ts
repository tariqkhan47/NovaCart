import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { normalizeComparePrice } from "@/lib/seo";
import { normalizeDetailHtml } from "@/lib/rich-text.mjs";
import { serializeProduct } from "@/lib/serialize";

// GET ALL PRODUCTS, each with its average rating and review count.
// Done as one groupBy rather than a query per product.
//
// ?category=Home Decor narrows it to one collection, so a category page does
// not have to pull the whole catalog down and filter in the browser.
export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");
    const featuredOnly = req.nextUrl.searchParams.get("featured") === "true";

    const where: Prisma.ProductWhereInput = {};
    if (category) where.category = category;
    if (featuredOnly) where.featured = true;

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const ratings = await prisma.review.groupBy({
      by: ["productId"],
      where: { productId: { in: products.map((p) => p.id) } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const ratingById = new Map(
      ratings.map((r) => [
        r.productId,
        { rating: r._avg.rating, reviewCount: r._count.rating },
      ])
    );

    return NextResponse.json(
      products.map((product) =>
        serializeProduct({ ...product, ...ratingById.get(product.id) })
      )
    );
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
    const product = await prisma.product.create({
      data: {
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
      },
    });

    return NextResponse.json(serializeProduct(product), { status: 201 });
  } catch (error) {
    console.error("POST PRODUCT ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}
