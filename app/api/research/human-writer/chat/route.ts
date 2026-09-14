import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import WritingProfile from "@/models/WritingProfile";
import { callLLM } from "@/lib/llm";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { message, history } = await req.json();
    if (!message?.trim()) return NextResponse.json({ message: "Missing message" }, { status: 400 });

    await connectDB();

    // Load user's writing profile
    const profile = await WritingProfile.findOne({ user_email: session.user.email });
    const styleRef = profile?.samples?.length
      ? profile.samples.map(s => s.content).join("\n\n---\n\n").slice(0, 4000)
      : null;

    const styleAnalysis = profile?.styleAnalysis || null;

    // Build conversation history
    const historyText = (history || [])
      .slice(-8)
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      )
      .join("\n");

    const styleSection = styleRef
      ? `You have access to the user's writing samples and style analysis below.
Your ONLY job is to respond to the user's request by writing content that PERFECTLY mirrors their writing style.
Match their sentence length, vocabulary, tone, paragraph structure, punctuation habits, transitions, and personality.
Never write in a generic AI style - always sound exactly like the user.

${styleAnalysis ? `STYLE ANALYSIS:\n${styleAnalysis}\n\n` : ""}WRITING SAMPLES (study these carefully):
${styleRef}`
      : `You are a helpful writing assistant. The user has not uploaded any writing samples yet, so respond helpfully but mention they can upload samples in the left panel to enable style-matching.`;

    const prompt = `${styleSection}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ""}
User: ${message}

Respond in the user's exact writing style. Do not add meta-commentary, just write the content they asked for:`;

    const response = await callLLM(prompt, 90000);

    return NextResponse.json({ message: response.trim() }, { status: 200 });
  } catch (e) {
    console.error("HW chat error:", e);
    return NextResponse.json({ message: "Failed to generate response" }, { status: 500 });
  }
}
