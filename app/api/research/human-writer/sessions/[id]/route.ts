import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import HumanWriterSession from "@/models/HumanWriterSession";

type Params = { params: Promise<{ id: string }> };

// GET - load a session
export async function GET(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const hwSession = await HumanWriterSession.findOne({
      _id: id,
      company_id: session.user.company_id,
      user_email:  session.user.email,
    });

    if (!hwSession) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ session: hwSession });
  } catch (e) {
    console.error("HW session GET error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// PATCH - append messages
export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body   = await req.json();
    await connectDB();

    const hwSession = await HumanWriterSession.findOne({
      _id: id,
      company_id: session.user.company_id,
      user_email:  session.user.email,
    });
    if (!hwSession) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (body.userMessage && body.assistantMessage) {
      // Auto-title from first message
      if (hwSession.messages.length === 0) {
        hwSession.title = (body.userMessage as string).slice(0, 60) +
          ((body.userMessage as string).length > 60 ? "…" : "");
      }
      hwSession.messages.push({ role: "user",      content: body.userMessage,      createdAt: new Date() });
      hwSession.messages.push({ role: "assistant", content: body.assistantMessage, createdAt: new Date() });
    }

    await hwSession.save();
    return NextResponse.json({ session: hwSession });
  } catch (e) {
    console.error("HW session PATCH error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    await HumanWriterSession.deleteOne({
      _id: id,
      company_id: session.user.company_id,
      user_email:  session.user.email,
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (e) {
    console.error("HW session DELETE error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
