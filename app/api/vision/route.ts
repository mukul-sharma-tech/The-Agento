import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { extractTextFromImage, analyzeImageForAnalytics } from "@/lib/vision";

export const maxDuration = 180; // Extended timeout for OCR tasks

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { base64Image, mode, context } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // mode: 'ocr' for basic text extraction, 'analytics' for structured JSON
    if (mode === "analytics") {
      const data = await analyzeImageForAnalytics(base64Image, context || "general data");
      return NextResponse.json({ success: true, data });
    } else {
      const text = await extractTextFromImage(base64Image);
      return NextResponse.json({ success: true, text });
    }
  } catch (error: any) {
    console.error("[Vision API] Error processing image:", error);
    return NextResponse.json(
      { error: "Vision processing failed", details: error.message },
      { status: 500 }
    );
  }
}
