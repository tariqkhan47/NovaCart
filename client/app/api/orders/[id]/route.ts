import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ORDER_STATUSES } from "@/types/order";
import { requireAdmin } from "@/lib/auth";
import { PAYMENT_STATUSES } from "@/lib/payments";
import { parseId } from "@/lib/ids";
import { serializeOrder } from "@/lib/serialize";

// UPDATE AN ORDER (admin only) — where it is with the courier, whether the
// money has arrived, or both.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin(req);
    if (guard instanceof NextResponse) return guard;

    const { id } = await params;
    const orderId = parseId(id);

    if (orderId === null) {
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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

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
        if (item.productId === null) continue;

        await prisma.product
          .update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
          .catch(() => {});
      }
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(status !== undefined && { status }),
        ...(paymentStatus !== undefined && { paymentStatus }),
      },
      include: { items: true },
    });

    return NextResponse.json(serializeOrder(updated));
  } catch (error) {
    console.error("UPDATE ORDER ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}

// REMOVE AN ORDER (admin only) — for the junk the shop accumulates: a test
// order, a duplicate, someone who filled the form in twice. There is no undo,
// so the dashboard asks first.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin(req);
    if (guard instanceof NextResponse) return guard;

    const { id } = await params;
    const orderId = parseId(id);

    if (orderId === null) {
      return NextResponse.json({ message: "Invalid Order ID" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // The same release a cancellation does, and for the same reason — the
    // stock was taken when the order was placed. Skipped for an order already
    // cancelled, which has had it back once already; putting it back twice
    // would invent inventory that does not exist.
    if (order.status !== "Cancelled") {
      for (const item of order.items) {
        if (item.productId === null) continue;

        await prisma.product
          .update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
          .catch(() => {});
      }
    }

    // The items go with it: OrderItem has onDelete: Cascade on its order
    // relation, so this is one statement rather than two.
    await prisma.order.delete({ where: { id: orderId } });

    return NextResponse.json({ id: String(orderId), deleted: true });
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);

    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
