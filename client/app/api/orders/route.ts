import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseId } from "@/lib/ids";
import { serializeOrder } from "@/lib/serialize";
import { getSessionFromRequest } from "@/lib/auth";
import { DELIVERY_CHARGE } from "@/lib/delivery";
import { initialPaymentStatus, paymentMethodInfo } from "@/lib/payments";
import { STORE } from "@/lib/store";
import { newUnsubscribeToken } from "@/lib/subscriber-token";

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

    const where =
      session.role === "admin" ? {} : { userId: Number(session.userId) };

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders.map(serializeOrder));
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
  const reserved: { id: number; quantity: number }[] = [];

  try {
    // Not required. A shopper who has signed in gets the order tied to their
    // account so it shows up under "My Orders"; a guest gets the same order
    // with no account attached. Everything the shop actually needs to fulfil
    // and to chase payment is in the form below either way.
    const session = await getSessionFromRequest(req);

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

    const orderItems: {
      productId: number;
      name: string;
      price: number;
      image: string;
      quantity: number;
    }[] = [];
    let subtotal = 0;

    for (const item of items) {
      const productId = parseId(String(item.productId ?? ""));
      const quantity = Number(item.quantity);

      if (productId === null) {
        throw Object.assign(new Error("Invalid product in cart"), {
          status: 400,
        });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw Object.assign(new Error("Invalid quantity"), {
          status: 400,
        });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw Object.assign(
          new Error("A product in your cart no longer exists"),
          { status: 409 }
        );
      }

      // Take the stock only if there is enough, in a single atomic update so
      // two shoppers cannot both claim the last unit.
      const claim = await prisma.product.updateMany({
        where: { id: productId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });

      if (claim.count === 0) {
        throw Object.assign(new Error(`Not enough stock for ${product.name}`), {
          status: 409,
        });
      }

      reserved.push({ id: productId, quantity });

      // Price comes from the database, never from the browser.
      subtotal += Number(product.price) * quantity;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image,
        quantity,
      });
    }

    const total = subtotal + DELIVERY_CHARGE;

    const order = await prisma.order.create({
      data: {
        userId: session ? Number(session.userId) : null,
        deliveryCharge: DELIVERY_CHARGE,
        total,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: address,
        paymentMethod: payment.method,
        paymentStatus: initialPaymentStatus(payment.method),
        paymentReference: reference || undefined,
        status: "Pending",
        items: { create: orderItems },
      },
      include: { items: true },
    });

    // Ordering signs the customer up for the mailing list. One row per email,
    // so a repeat customer just has their details refreshed and their order
    // count bumped. The order is already placed at this point, so a failure
    // here is logged and swallowed rather than handed back to the shopper.
    //
    // active and the token are only set on insert: somebody who has already
    // unsubscribed stays off the list no matter how much they order.
    try {
      await prisma.subscriber.upsert({
        where: { email: String(email).trim().toLowerCase() },
        update: {
          name,
          phone,
          orderCount: { increment: 1 },
        },
        create: {
          email: String(email).trim().toLowerCase(),
          name,
          phone,
          source: "order",
          active: true,
          unsubscribeToken: newUnsubscribeToken(),
          orderCount: 1,
        },
      });
    } catch (error) {
      console.error("SUBSCRIBE ON ORDER ERROR:", error);
    }

    return NextResponse.json(serializeOrder(order), { status: 201 });
  } catch (error) {
    // Put back anything we already reserved.
    for (const item of reserved) {
      await prisma.product
        .update({
          where: { id: item.id },
          data: { stock: { increment: item.quantity } },
        })
        .catch(() => {});
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
