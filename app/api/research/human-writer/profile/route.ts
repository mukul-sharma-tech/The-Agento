/**
 * GET  — fetch the user's writing profile (samples + cached analysis)
 * POST — upload a new writing sample (persists to DB)
 * DELETE ?sampleId=xxx — remove a sample
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import WritingProfile from "@/models/WritingProfile";
import { callLLM } from "@/lib/llm";

// ── helpers ──────────────────────────────────────────────────────────────────

async function getOrCreate(companyId: string, userEmail: string) {
  let profile = await WritingProfile.findOne({ user_email: userEmail });
  if (!profile) {
    profile = await WritingProfile.create({
      company_id: companyId,
      user_email:  userEmail,
      samples:    [],
      styleAnalysis: "",
      analysedAt:  null,
    });
  }
  return profile;
}

async function refreshAnalysis(profile: InstanceType<typeof WritingProfile>) {
  if (profile.samples.length === 0) {
    profile.styleAnalysis = "";
    profile.analysedAt = null;
    await profile.save();
    return;
  }
  const combined = profile.samples
    .map((s) => s.content)
    .join("\n\n---\n\n")
    .slice(0, 4000);

  const prompt = `Analyze the writing style in the samples below. Be specific and actionable (3-5 sentences).
Cover: sentence length, vocabulary level, tone, paragraph structure, punctuation habits, transitions, and any unique stylistic fingerprints.

WRITING SAMPLES:
${combined}

Style Analysis:`;

  try {
    const analysis = await callLLM(prompt);
    profile.styleAnalysis = analysis.trim();
    profile.analysedAt = new Date();
    await profile.save();
  } catch {
    // non-fatal — keep old analysis
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const profile = await getOrCreate(session.user.company_id, session.user.email!);

    return NextResponse.json({
      samples: profile.samples.map(s => ({
        sampleId:   s.sampleId,
        filename:   s.filename,
        words:      s.words,
        uploadedAt: s.uploadedAt,
      })),
      styleAnalysis: profile.styleAnalysis,
      analysedAt:    profile.analysedAt,
    });
  } catch (e) {
    console.error("WritingProfile GET error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

// ── POST (upload sample) ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ message: "No file" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["txt", "md"].includes(ext || "")) {
      return NextResponse.json({ message: "Only .txt and .md files supported" }, { status: 400 });
    }
    if (file.size > 800 * 1024) {
      return NextResponse.json({ message: "File too large (max 800 KB)" }, { status: 400 });
    }

    const content = await file.text();
    const words   = content.split(/\s+/).filter(Boolean).length;
    const sampleId = `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await connectDB();
    const profile = await getOrCreate(session.user.company_id, session.user.email!);

    profile.samples.push({ sampleId, filename: file.name, content, words, uploadedAt: new Date() });
    await profile.save();

    // Refresh analysis in background (don't await to keep response fast)
    refreshAnalysis(profile).catch(() => {});

    return NextResponse.json({ sampleId, filename: file.name, words }, { status: 201 });
  } catch (e) {
    console.error("WritingProfile POST error:", e);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sampleId = searchParams.get("sampleId");
    if (!sampleId) return NextResponse.json({ message: "Missing sampleId" }, { status: 400 });

    await connectDB();
    const profile = await WritingProfile.findOne({ user_email: session.user.email });
    if (!profile) return NextResponse.json({ ok: true });

    profile.samples = profile.samples.filter(s => s.sampleId !== sampleId) as typeof profile.samples;
    await profile.save();

    // Refresh analysis
    refreshAnalysis(profile).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("WritingProfile DELETE error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
