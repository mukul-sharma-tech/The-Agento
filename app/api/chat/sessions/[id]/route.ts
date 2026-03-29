import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import ChatSession from "@/models/ChatSession";
import { resolveGuestToken } from "@/lib/guestAuth";

// GET - load a single session with all messages
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const guestToken = req.headers.get("x-guest-token");
    const guest = session?.user ? null : await resolveGuestToken(guestToken);
    const identity = session?.user ?? guest;
    if (!identity) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const chatSession = await ChatSession.findOne({
      _id: id,
      company_id: identity.company_id,
      user_email: identity.email,
    });

    if (!chatSession) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ session: chatSession });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// PATCH - append a message pair + update title if first message
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const guestToken = req.headers.get("x-guest-token");
    const guest = session?.user ? null : await resolveGuestToken(guestToken);
    const identity = session?.user ?? guest;
    if (!identity) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { userMessage, assistantMessage, mermaidCode, citations } = await req.json();

    await connectDB();
    const chatSession = await ChatSession.findOne({
      _id: id,
      company_id: identity.company_id,
      user_email: identity.email,
    });

    if (!chatSession) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (chatSession.messages.length === 0 && userMessage) {
      chatSession.title = userMessage.slice(0, 60) + (userMessage.length > 60 ? "…" : "");
    }

    chatSession.messages.push({ role: "user", content: userMessage, createdAt: new Date() });
    chatSession.messages.push({
      role: "assistant", content: assistantMessage,
      ...(mermaidCode && { mermaidCode }),
      ...(citations?.length && { citations }),
      createdAt: new Date(),
    });

    await chatSession.save();
    return NextResponse.json({ session: chatSession });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// DELETE - remove a session
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const guestToken = req.headers.get("x-guest-token");
    const guest = session?.user ? null : await resolveGuestToken(guestToken);
    const identity = session?.user ?? guest;
    if (!identity) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();
    await ChatSession.deleteOne({
      _id: id,
      company_id: identity.company_id,
      user_email: identity.email,
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
