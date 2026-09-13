import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import HumanWriterSession from "@/models/HumanWriterSession";

// GET — list all sessions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const sessions = await HumanWriterSession.find({
      company_id: session.user.company_id,
      user_email:  session.user.email ?? "",
    })
      .sort({ updatedAt: -1 })
      .select("_id title createdAt updatedAt messages")
      .lean();

    return NextResponse.json({ sessions });
  } catch (e) {
    console.error("HW sessions GET error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// POST — create a new session
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const hwSession = await HumanWriterSession.create({
      company_id: session.user.company_id,
      user_email:  session.user.email ?? "",
      title:      "New Chat",
      messages:   [],
    });

    return NextResponse.json({ session: hwSession }, { status: 201 });
  } catch (e) {
    console.error("HW sessions POST error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
