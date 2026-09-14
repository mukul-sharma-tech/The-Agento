import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Tesseract from "tesseract.js";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp", "image/tiff"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image type. Use PNG, JPEG, WebP, BMP, or TIFF." },
        { status: 400 }
      );
    }

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large (max 5 MB)" }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run OCR
    const { data: { text } } = await Tesseract.recognize(buffer, "eng", {
      logger: () => {}, // suppress progress logs
    });

    const extracted = text.trim();

    if (!extracted) {
      return NextResponse.json({ error: "No text found in the image" }, { status: 422 });
    }

    return NextResponse.json({ text: extracted }, { status: 200 });
  } catch (error) {
    console.error("OCR API Error:", error);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
