// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db";
// import User from "@/models/User";
// import crypto from "crypto";

// export async function POST(req: Request) {
//   try {
//     const { email } = await req.json();

//     if (!email) {
//       return NextResponse.json(
//         { message: "Email is required" },
//         { status: 400 }
//       );
//     }

//     await connectDB();

//     const user = await User.findOne({ email });

//     if (!user) {
//       // Security: don't reveal user existence
//       return NextResponse.json({
//         message: "If account exists, reset link sent",
//       });
//     }

//     const token = crypto.randomBytes(32).toString("hex");
//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(token)
//       .digest("hex");

//     user.resetPasswordToken = hashedToken;
//     user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
//     await user.save();

//     console.log(
//       `RESET LINK: ${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
//     );

//     return NextResponse.json({
//       message: "Password reset link sent",
//     });
//   } catch {
//     return NextResponse.json(
//       { message: "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      // Security: don't reveal user existence
      return NextResponse.json({
        message: "If account exists, reset link sent",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    console.log(
      `RESET LINK: ${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    );

    // For development/testing: return the token to auto-redirect
    // In production, you would send this via email instead
    return NextResponse.json({
      message: "Password reset link sent",
      token: token, // This enables auto-redirect in the frontend
    });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}