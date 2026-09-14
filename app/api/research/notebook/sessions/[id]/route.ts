import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import NotebookSession from "@/models/NotebookSession";

type Params = { params: Promise<{ id: string }> };

// GET - load a single notebook (full data)
export async function GET(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const notebook = await NotebookSession.findOne({
      _id: id,
      company_id: session.user.company_id,
      user_email:  session.user.email,
    });

    if (!notebook) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ notebook });
  } catch (e) {
    console.error("Notebook GET [id] error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// PATCH - update title/description, append doc, or append a message pair
export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    await connectDB();

    const notebook = await NotebookSession.findOne({
      _id: id,
      company_id: session.user.company_id,
      user_email:  session.user.email,
    });
    if (!notebook) return NextResponse.json({ message: "Not found" }, { status: 404 });

    // Update metadata
    if (body.title !== undefined)       notebook.title       = body.title;
    if (body.description !== undefined) notebook.description = body.description;

    // Append a doc reference
    if (body.addDoc) {
      notebook.docs.push(body.addDoc);
    }

    // Remove a doc reference
    if (body.removeDocId) {
      notebook.docs = notebook.docs.filter((d) => d.docId !== body.removeDocId) as typeof notebook.docs;
    }

    // Append a message pair
    if (body.userMessage && body.assistantMessage) {
      // Auto-title from first message
      if (notebook.messages.length === 0 && notebook.title === "Untitled Notebook") {
        notebook.title = (body.userMessage as string).slice(0, 60) +
          ((body.userMessage as string).length > 60 ? "…" : "");
      }
      notebook.messages.push({
        role:      "user",
        content:   body.userMessage,
        citations: [],
        createdAt: new Date(),
      });
      notebook.messages.push({
        role:      "assistant",
        content:   body.assistantMessage,
        citations: body.citations || [],
        createdAt: new Date(),
      });
    }

    await notebook.save();
    return NextResponse.json({ notebook });
  } catch (e) {
    console.error("Notebook PATCH [id] error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// DELETE - remove a notebook
export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    await NotebookSession.deleteOne({
      _id: id,
      company_id: session.user.company_id,
      user_email:  session.user.email,
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (e) {
    console.error("Notebook DELETE [id] error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
