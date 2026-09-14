import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import ResearchSession from "@/models/ResearchSession";

// GET - list all research sessions for the user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const sessions = await ResearchSession.find({
      company_id: session.user.company_id,
      user_email: session.user.email ?? "",
    })
      .sort({ updatedAt: -1 })
      .select("_id title inputs output createdAt updatedAt")
      .lean();

    return NextResponse.json({ sessions });
  } catch (e) {
    console.error("Research sessions GET error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// POST - save a completed research session
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { inputs, output } = body;

    if (!inputs || !output) {
      return NextResponse.json({ message: "Missing inputs or output" }, { status: 400 });
    }

    // Generate title from the first ~60 chars of the idea field
    const raw = inputs.idea?.trim() ?? "";
    const title = raw.length > 0
      ? raw.slice(0, 60) + (raw.length > 60 ? "…" : "")
      : "Untitled Research";

    await connectDB();
    const doc = await ResearchSession.create({
      company_id: session.user.company_id,
      user_email: session.user.email ?? "",
      title,
      inputs,
      output,
    });

    return NextResponse.json({ session: doc }, { status: 201 });
  } catch (e) {
    console.error("Research sessions POST error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
