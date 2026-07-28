import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Subscriber, { newUnsubscribeToken } from "@/models/Subscriber";

// Good enough to catch a typo. Anything stricter starts rejecting addresses
// that are perfectly valid.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The footer signup box. Public on purpose — anyone browsing can join the
 * list without an account.
 *
 * Unlike the automatic signup on checkout, this is somebody asking to be on
 * the list, so it also brings back an address that had unsubscribed.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!EMAIL.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Subscriber.findOne({ email });

    if (existing?.active) {
      return NextResponse.json({
        message: "You are already on the list.",
      });
    }

    await Subscriber.updateOne(
      { email },
      {
        $set: { active: true },
        $setOnInsert: {
          source: "newsletter",
          unsubscribeToken: newUnsubscribeToken(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: existing
        ? "Welcome back — you are on the list again."
        : "You are on the list. Watch out for our offers!",
    });
  } catch (error) {
    console.error("SUBSCRIBE ERROR:", error);

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
