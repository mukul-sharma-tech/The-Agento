import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { callLLM } from "@/lib/llm";

const STORE_KEY = "__hw_sessions__";
type SampleEntry = { id: string; filename: string; content: string };
type SessionMap = Map<string, SampleEntry[]>;

function getStore(): SessionMap {
  const g = global as unknown as Record<string, SessionMap>;
  if (!g[STORE_KEY]) g[STORE_KEY] = new Map<string, SampleEntry[]>();
  return g[STORE_KEY];
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ message: "Missing sessionId" }, { status: 400 });

    const store = getStore();
    const samples = store.get(sessionId);
    if (!samples || samples.length === 0) {
      return NextResponse.json({ message: "No writing samples found" }, { status: 400 });
    }

    const combined = samples.map((s) => s.content).join("\n\n---\n\n").slice(0, 3000);

    const prompt = `Analyze the writing style in the following text samples. Be concise (2-3 sentences).
Identify: sentence length pattern, vocabulary level, tone, common structures, and unique stylistic traits.

WRITING SAMPLES:
${combined}

Provide a brief, specific style analysis:`;

    const analysis = await callLLM(prompt);

    return NextResponse.json({ analysis: analysis.trim() }, { status: 200 });
  } catch (e) {
    console.error("HW analyze error:", e);
    return NextResponse.json({ message: "Analysis failed" }, { status: 500 });
  }
}
