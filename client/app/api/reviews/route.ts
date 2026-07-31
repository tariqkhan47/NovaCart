import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseId } from "@/lib/ids";
import { serializeReview } from "@/lib/serialize";

// LIST REVIEWS — all recent, or just one product's with ?productId=
export async function GET(req: NextRequest) {
  try {
    const productIdParam = req.nextUrl.searchParams.get("productId");

    if (productIdParam) {
      const productId = parseId(productIdParam);

      if (productId === null) {
        return NextResponse.json(
          { message: "Invalid Product ID" },
          { status: 400 }
        );
      }

      const reviews = await prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(reviews.map(serializeReview));
    }

    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { product: { select: { name: true, image: true } } },
    });

    return NextResponse.json(reviews.map(serializeReview));
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

    const { productId: productIdRaw, rating, comment } = await req.json();
    const productId = parseId(String(productIdRaw ?? ""));

    if (productId === null) {
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

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // The name comes from the session, never from the request body, so a
    // reviewer cannot post under someone else's name.
    const review = await prisma.review.create({
      data: {
        productId,
        userId: Number(session.userId),
        name: session.name,
        rating: numericRating,
        comment: String(comment).trim(),
      },
    });

    return NextResponse.json(serializeReview(review), { status: 201 });
  } catch (error) {
    // Unique constraint on (productId, userId)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
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
