import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE,
  signSession,
  sessionCookieOptions,
} from "@/lib/session";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const publicUser = {
      userId: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role === "admin" ? ("admin" as const) : ("customer" as const),
    };

    const token = await signSession(publicUser);

    const res = NextResponse.json(
      { message: "Login Successful", user: publicUser },
      { status: 200 }
    );

    // httpOnly so page scripts can never read or forge it.
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);

    return res;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}
