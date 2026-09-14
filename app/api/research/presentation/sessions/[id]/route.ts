import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import PresentationSession from "@/models/PresentationSession";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const presDoc = await PresentationSession.findOne({
      _id: id,
      company_id: session.user.company_id,
      user_email: session.user.email ?? "",
    }).lean();

    if (!presDoc) {
      return NextResponse.json({ message: "Presentation session not found" }, { status: 404 });
    }

    return NextResponse.json({ session: presDoc });
  } catch (e) {
    console.error("Presentation session GET by ID error:", e);
    return NextResponse.json({ message: "Failed to fetch presentation" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const deleted = await PresentationSession.findOneAndDelete({
      _id: id,
      company_id: session.user.company_id,
      user_email: session.user.email ?? "",
    });

    if (!deleted) {
      return NextResponse.json({ message: "Presentation session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Session deleted" });
  } catch (e) {
    console.error("Presentation session DELETE error:", e);
    return NextResponse.json({ message: "Failed to delete presentation" }, { status: 500 });
  }
}
