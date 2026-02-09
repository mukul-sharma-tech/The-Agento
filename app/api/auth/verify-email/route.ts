import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // First check if user exists with this token (even if expired)
    const userWithToken = await User.findOne({ emailVerificationToken: hashedToken });

    if (!userWithToken) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check if already verified
    if (userWithToken.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified. Please login." },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (userWithToken.emailVerificationExpiry && userWithToken.emailVerificationExpiry < new Date()) {
      // Generate a new token and send new verification email
      const newVerificationToken = crypto.randomBytes(32).toString("hex");
      const newHashedVerificationToken = crypto
        .createHash("sha256")
        .update(newVerificationToken)
        .digest("hex");

      userWithToken.emailVerificationToken = newHashedVerificationToken;
      userWithToken.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await userWithToken.save();

      // Import sendVerificationEmail here to avoid circular dependency
      const { sendVerificationEmail } = await import("@/lib/email");
      await sendVerificationEmail(userWithToken.email, newVerificationToken);

      return NextResponse.json(
        { message: "Token has expired. A new verification email has been sent to your email address." },
        { status: 400 }
      );
    }

    // Token is valid - verify the email
    userWithToken.emailVerified = true;
    userWithToken.emailVerificationToken = undefined;
    userWithToken.emailVerificationExpiry = undefined;
    await userWithToken.save();

    return NextResponse.json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
