import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import ChatSession from "@/models/ChatSession";

// GET - list all sessions for the current user (optionally filtered by mode)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode"); // "chat" | "voice" | null (all)

    await connectDB();
    const filter: Record<string, string> = {
      company_id: session.user.company_id,
      user_email: session.user.email ?? "",
    };
    if (mode) filter.mode = mode;

    const sessions = await ChatSession.find(filter)
      .sort({ updatedAt: -1 })
      .select("_id title mode createdAt updatedAt messages")
      .lean();

    return NextResponse.json({ sessions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// POST - create a new empty session
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === "voice" ? "voice" : "chat";

    await connectDB();
    const chatSession = await ChatSession.create({
      company_id: session.user.company_id,
      user_email: session.user.email ?? "",
      title: "New Chat",
      mode,
      messages: [],
    });

    return NextResponse.json({ session: chatSession }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
