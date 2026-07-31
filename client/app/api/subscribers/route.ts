import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { serializeSubscriber } from "@/lib/serialize";

// LIST SUBSCRIBERS (admin only) — the mailing list orders have built up.
export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req);
    if (guard instanceof NextResponse) return guard;

    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(subscribers.map(serializeSubscriber));
  } catch (error) {
    console.error("GET SUBSCRIBERS ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}
