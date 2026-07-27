import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function POST(req: Request) {
  try {
    await connectDB();

    const {
      name,
      price,
      category,
      image,
      description,
      stock,
    } = await req.json();

    const product = await Product.create({
      name,
      price,
      category,
      image,
      description,
      stock,
    });

    return NextResponse.json(
      {
        message: "Product Added Successfully",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find().sort({
      createdAt: -1,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}