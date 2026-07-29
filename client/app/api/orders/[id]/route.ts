import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Order, { ORDER_STATUSES } from "@/models/Order";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";
import { PAYMENT_STATUSES } from "@/lib/payments";

// UPDATE AN ORDER (admin only) — where it is with the courier, whether the
// money has arrived, or both.
export async function PATCH(
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
        { message: "Invalid Order ID" },
        { status: 400 }
      );
    }

    const { status, paymentStatus } = await req.json();

    if (status === undefined && paymentStatus === undefined) {
      return NextResponse.json(
        { message: "Nothing to update" },
        { status: 400 }
      );
    }

    if (status !== undefined && !ORDER_STATUSES.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status" },
        { status: 400 }
      );
    }

    if (
      paymentStatus !== undefined &&
      !PAYMENT_STATUSES.includes(paymentStatus)
    ) {
      return NextResponse.json(
        { message: "Invalid payment status" },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    // Cancelling releases the stock back; only once, no matter how many
    // times the status is toggled.
    if (status === "Cancelled" && order.status !== "Cancelled") {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } }
        ).catch(() => {});
      }
    }

    if (status !== undefined) order.status = status;
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;

    await order.save();

    return NextResponse.json(order);
  } catch (error) {
    console.error("UPDATE ORDER ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}
