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

    const { topic, tone, format, wordCount, extraInstructions, sessionId } = await req.json();

    if (!topic?.trim() || !sessionId) {
      return NextResponse.json({ message: "Missing topic or sessionId" }, { status: 400 });
    }

    const store = getStore();
    const samples = store.get(sessionId);
    if (!samples || samples.length === 0) {
      return NextResponse.json({ message: "No writing samples found for this session" }, { status: 400 });
    }

    // Use first 2000 chars of combined samples for style reference
    const styleReference = samples.map((s) => s.content).join("\n\n---\n\n").slice(0, 2500);

    const prompt = `You are a professional content writer. Your task is to write content that EXACTLY matches the writing style shown in the sample below.

WRITING STYLE SAMPLES (study this carefully - match the sentence structure, vocabulary, tone, and patterns):
${styleReference}

---

Now write the following in the SAME STYLE as the samples above:
- Topic: ${topic}
- Format: ${format}
- Tone: ${tone}
- Target word count: approximately ${wordCount} words
${extraInstructions ? `- Additional instructions: ${extraInstructions}` : ""}

CRITICAL: Mirror the style exactly - if the samples use short punchy sentences, do that. If they use complex academic language, do that. Match paragraph length, transition patterns, and vocabulary level.

Write the content now (do NOT add explanations before or after, just the content itself):`;

    const content = await callLLM(prompt, 90000);

    return NextResponse.json({ content: content.trim() }, { status: 200 });
  } catch (e) {
    console.error("HW generate error:", e);
    return NextResponse.json({ message: "Generation failed" }, { status: 500 });
  }
}
