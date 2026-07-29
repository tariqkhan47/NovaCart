import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Subscriber, { newUnsubscribeToken } from "@/models/Subscriber";
import { getSessionFromRequest, requireUser } from "@/lib/auth";
import { DELIVERY_CHARGE } from "@/lib/delivery";
import { initialPaymentStatus, paymentMethodInfo } from "@/lib/payments";

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
    const { items, name, email, phone, address, paymentMethod, paymentReference } =
      body;

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

    // Checked here rather than taken on the browser's word: the page could be
    // stale, or the request could not have come from the page at all. Anything
    // the owner has not set an account up for is refused.
    const payment = paymentMethodInfo(String(paymentMethod ?? "cod"));

    if (!payment?.available) {
      return NextResponse.json(
        { message: "That payment method is not available" },
        { status: 400 }
      );
    }

    const reference = payment.needsReference
      ? String(paymentReference ?? "").trim()
      : "";

    if (payment.needsReference && !reference) {
      return NextResponse.json(
        { message: `Please enter the ${payment.referenceLabel}` },
        { status: 400 }
      );
    }

    // No transaction ID runs anywhere near this long; anything that does is
    // not one, and it would only make the admin list unreadable.
    if (reference.length > 64) {
      return NextResponse.json(
        { message: `That is not a valid ${payment.referenceLabel}` },
        { status: 400 }
      );
    }

    const orderItems = [];
    let subtotal = 0;

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
      subtotal += claimed.price * quantity;

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
      deliveryCharge: DELIVERY_CHARGE,
      total: subtotal + DELIVERY_CHARGE,
      customer: { name, email, phone, address },
      paymentMethod: payment.method,
      paymentStatus: initialPaymentStatus(payment.method),
      paymentReference: reference || undefined,
      status: "Pending",
    });

    // Ordering signs the customer up for the mailing list. One row per email,
    // so a repeat customer just has their details refreshed and their order
    // count bumped. The order is already placed at this point, so a failure
    // here is logged and swallowed rather than handed back to the shopper.
    //
    // active and the token are only set on insert: somebody who has already
    // unsubscribed stays off the list no matter how much they order.
    try {
      await Subscriber.updateOne(
        { email: String(email).trim().toLowerCase() },
        {
          $set: { name, phone },
          $setOnInsert: {
            source: "order",
            active: true,
            unsubscribeToken: newUnsubscribeToken(),
          },
          $inc: { orderCount: 1 },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error("SUBSCRIBE ON ORDER ERROR:", error);
    }

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
