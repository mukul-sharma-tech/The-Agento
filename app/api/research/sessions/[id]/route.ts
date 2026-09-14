import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import ResearchSession from "@/models/ResearchSession";

// GET - load a single session
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const doc = await ResearchSession.findOne({
      _id: id,
      company_id: session.user.company_id,
      user_email: session.user.email,
    });

    if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ session: doc });
  } catch (e) {
    console.error("Research session GET [id] error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// DELETE - remove a session
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    await ResearchSession.deleteOne({
      _id: id,
      company_id: session.user.company_id,
      user_email: session.user.email,
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (e) {
    console.error("Research session DELETE error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
