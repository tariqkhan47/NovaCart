import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

// GET ALL PRODUCTS
export async function GET() {
  try {
    await connectDB();

    const products = await Product.find().sort({ createdAt: -1 });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}

// ADD PRODUCT
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const product = await Product.create(body);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST PRODUCT ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}