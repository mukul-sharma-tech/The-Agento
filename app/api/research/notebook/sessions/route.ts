import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import NotebookSession from "@/models/NotebookSession";

// GET — list all notebooks
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const notebooks = await NotebookSession.find({
      company_id: session.user.company_id,
      user_email:  session.user.email ?? "",
    })
      .sort({ updatedAt: -1 })
      .select("_id title description docs messages createdAt updatedAt")
      .lean();

    return NextResponse.json({ notebooks });
  } catch (e) {
    console.error("Notebook sessions GET error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// POST — create a new notebook
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const title       = (body.title as string)?.trim() || "Untitled Notebook";
    const description = (body.description as string)?.trim() || "";

    await connectDB();
    const notebook = await NotebookSession.create({
      company_id:  session.user.company_id,
      user_email:  session.user.email ?? "",
      title,
      description,
      docs:     [],
      messages: [],
    });

    return NextResponse.json({ notebook }, { status: 201 });
  } catch (e) {
    console.error("Notebook sessions POST error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
