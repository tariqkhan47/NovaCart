import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";

/**
 * Mailing list opt-out. Deliberately open — the token in the link is the only
 * credential, because somebody clicking unsubscribe in an email has no reason
 * to hold an account or still be signed in.
 */

// Look up who a token belongs to, so the page can name the address before it
// changes anything. Read-only, which also means a mail scanner following the
// link cannot take somebody off the list by accident.
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "This unsubscribe link is missing its code" },
        { status: 400 }
      );
    }

    await connectDB();

    const subscriber = await Subscriber.findOne({ unsubscribeToken: token });

    if (!subscriber) {
      return NextResponse.json(
        { message: "This unsubscribe link is not valid" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      email: subscriber.email,
      active: subscriber.active,
    });
  } catch (error) {
    console.error("GET UNSUBSCRIBE ERROR:", error);

    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

// Take the address off the list, or put it back when someone clicks undo.
export async function POST(req: NextRequest) {
  try {
    const { token, resubscribe } = await req.json();

    if (!token) {
      return NextResponse.json(
        { message: "This unsubscribe link is missing its code" },
        { status: 400 }
      );
    }

    await connectDB();

    const subscriber = await Subscriber.findOneAndUpdate(
      { unsubscribeToken: token },
      { $set: { active: Boolean(resubscribe) } },
      { new: true }
    );

    if (!subscriber) {
      return NextResponse.json(
        { message: "This unsubscribe link is not valid" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      email: subscriber.email,
      active: subscriber.active,
    });
  } catch (error) {
    console.error("UNSUBSCRIBE ERROR:", error);

    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
