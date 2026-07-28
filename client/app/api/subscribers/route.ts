import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";
import { requireAdmin } from "@/lib/auth";

// LIST SUBSCRIBERS (admin only) — the mailing list orders have built up.
export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req);
    if (guard instanceof NextResponse) return guard;

    await connectDB();

    const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });

    return NextResponse.json(subscribers);
  } catch (error) {
    console.error("GET SUBSCRIBERS ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}
