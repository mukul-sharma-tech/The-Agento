import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import PublicLink from "@/models/PublicLink";
import crypto from "crypto";

// GET — fetch the current public link for the admin's company
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const link = await PublicLink.findOne({ company_id: session.user.company_id });
    return NextResponse.json({ link: link ?? null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// POST — generate a new public link (or return existing)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // If one already exists, return it
    const existing = await PublicLink.findOne({ company_id: session.user.company_id });
    if (existing) {
      return NextResponse.json({ link: existing });
    }

    const token = crypto.randomBytes(20).toString("hex");
    const link = await PublicLink.create({
      token,
      company_id: session.user.company_id,
      company_name: session.user.company_name,
      enabled: true,
      features: ["chat"],
      guestCallCount: 0,
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// PATCH — toggle enabled / regenerate token / update features
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, features } = body; // action: "toggle" | "regenerate" | "features"

    await connectDB();
    const link = await PublicLink.findOne({ company_id: session.user.company_id });
    if (!link) return NextResponse.json({ message: "No link found" }, { status: 404 });

    if (action === "toggle") {
      link.enabled = !link.enabled;
    } else if (action === "regenerate") {
      link.token = crypto.randomBytes(20).toString("hex");
      link.guestCallCount = 0;
    } else if (action === "features" && Array.isArray(features)) {
      link.features = features;
    }

    await link.save();
    return NextResponse.json({ link });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// DELETE — remove the public link entirely
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await PublicLink.deleteOne({ company_id: session.user.company_id });
    return NextResponse.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
