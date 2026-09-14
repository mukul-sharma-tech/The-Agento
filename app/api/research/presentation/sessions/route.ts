import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import PresentationSession from "@/models/PresentationSession";

// GET - list all presentation sessions for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const sessions = await PresentationSession.find({
      company_id: session.user.company_id,
      user_email: session.user.email ?? "",
    })
      .sort({ updatedAt: -1 })
      .select("_id title topic slideCount theme tone targetAudience rawContent slides createdAt updatedAt")
      .lean();

    return NextResponse.json({ sessions });
  } catch (e) {
    console.error("Presentation sessions GET error:", e);
    return NextResponse.json({ message: "Failed to fetch presentation sessions" }, { status: 500 });
  }
}

// POST - save or update a presentation session
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      title,
      topic = "",
      slideCount = 6,
      theme = "indigo",
      tone = "professional",
      targetAudience = "general",
      rawContent = "",
      slides = [],
    } = body;

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ message: "No slide content provided" }, { status: 400 });
    }

    const finalTitle =
      title?.trim() ||
      topic?.trim() ||
      slides[0]?.title ||
      "Untitled Presentation";

    await connectDB();

    if (id) {
      const updated = await PresentationSession.findOneAndUpdate(
        {
          _id: id,
          company_id: session.user.company_id,
          user_email: session.user.email ?? "",
        },
        {
          $set: {
            title: finalTitle,
            topic,
            slideCount: slides.length,
            theme,
            tone,
            targetAudience,
            rawContent,
            slides,
          },
        },
        { new: true }
      );

      if (updated) {
        return NextResponse.json({ session: updated }, { status: 200 });
      }
    }

    const doc = await PresentationSession.create({
      company_id: session.user.company_id,
      user_email: session.user.email ?? "",
      title: finalTitle,
      topic,
      slideCount: slides.length,
      theme,
      tone,
      targetAudience,
      rawContent,
      slides,
    });

    return NextResponse.json({ session: doc }, { status: 201 });
  } catch (e) {
    console.error("Presentation sessions POST error:", e);
    return NextResponse.json({ message: "Failed to save presentation session" }, { status: 500 });
  }
}
