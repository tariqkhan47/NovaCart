import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getSessionFromRequest, requireUser } from "@/lib/auth";

// LIST ORDERS — admins see every order, customers see only their own.
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { message: "You must be logged in" },
        { status: 401 }
      );
    }

    await connectDB();

    const filter =
      session.role === "admin" ? {} : { user: session.userId };

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}

// PLACE ORDER
export async function POST(req: NextRequest) {
  // Tracks what we already took off the shelf, so we can put it back if a
  // later item turns out to be unavailable.
  const reserved: { id: string; quantity: number }[] = [];

  try {
    const session = await requireUser(req);
    if (session instanceof NextResponse) return session;

    await connectDB();

    const body = await req.json();
    const { items, name, email, phone, address } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "Your cart is empty" },
        { status: 400 }
      );
    }

    if (!name || !email || !phone || !address) {
      return NextResponse.json(
        { message: "Please fill in all delivery details" },
        { status: 400 }
      );
    }

    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const productId = String(item.productId ?? "");
      const quantity = Number(item.quantity);

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw Object.assign(new Error("Invalid product in cart"), {
          status: 400,
        });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw Object.assign(new Error("Invalid quantity"), {
          status: 400,
        });
      }

      // Take the stock only if there is enough, in a single atomic update so
      // two shoppers cannot both claim the last unit.
      const claimed = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: false }
      );

      if (!claimed) {
        const exists = await Product.findById(productId);

        throw Object.assign(
          new Error(
            exists
              ? `Not enough stock for ${exists.name}`
              : "A product in your cart no longer exists"
          ),
          { status: 409 }
        );
      }

      reserved.push({ id: productId, quantity });

      // Price comes from the database, never from the browser.
      total += claimed.price * quantity;

      orderItems.push({
        product: claimed._id,
        name: claimed.name,
        price: claimed.price,
        image: claimed.image,
        quantity,
      });
    }

    const order = await Order.create({
      user: session.userId,
      items: orderItems,
      total,
      customer: { name, email, phone, address },
      paymentMethod: "cod",
      status: "Pending",
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    // Put back anything we already reserved.
    for (const item of reserved) {
      await Product.updateOne(
        { _id: item.id },
        { $inc: { stock: item.quantity } }
      ).catch(() => {});
    }

    const status = (error as { status?: number }).status;

    if (status) {
      return NextResponse.json(
        { message: (error as Error).message },
        { status }
      );
    }

    console.error("CREATE ORDER ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}
