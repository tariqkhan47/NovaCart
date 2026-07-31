import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newUnsubscribeToken } from "@/lib/subscriber-token";

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

    const existing = await prisma.subscriber.findUnique({ where: { email } });

    if (existing?.active) {
      return NextResponse.json({
        message: "You are already on the list.",
      });
    }

    await prisma.subscriber.upsert({
      where: { email },
      update: { active: true },
      create: {
        email,
        source: "newsletter",
        unsubscribeToken: newUnsubscribeToken(),
      },
    });

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
