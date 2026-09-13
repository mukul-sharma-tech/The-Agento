import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { callLLM, getEmbedding } from "@/lib/llm";

const STORE_KEY = "__coding_sessions__";
type CodeChunk = { text: string; embedding: number[]; model: string };
type CodeFile = { name: string; path: string; size: number; content: string; chunks: CodeChunk[] };
type SessionMap = Map<string, CodeFile[]>;

function getStore(): SessionMap {
  const g = global as unknown as Record<string, SessionMap>;
  if (!g[STORE_KEY]) g[STORE_KEY] = new Map<string, CodeFile[]>();
  return g[STORE_KEY];
}

function cosine(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { message, history, sessionId } = await req.json();
    if (!message || !sessionId) return NextResponse.json({ message: "Missing fields" }, { status: 400 });

    const store = getStore();
    const files = store.get(sessionId);

    if (!files || files.length === 0) {
      return NextResponse.json({ message: "No codebase uploaded for this session." }, { status: 400 });
    }

    // Embed query
    let queryEmb: number[] = [];
    let queryModel = "";
    try {
      const r = await getEmbedding(message);
      queryEmb = r.embedding;
      queryModel = r.model;
    } catch { /* fallback */ }

    // Search across all file chunks
    const allChunks: { text: string; filename: string; score: number }[] = [];
    for (const file of files) {
      for (const chunk of file.chunks) {
        let score = 0;
        if (queryEmb.length > 0 && chunk.embedding.length > 0 && chunk.model === queryModel) {
          score = cosine(queryEmb, chunk.embedding);
        } else if (chunk.text.toLowerCase().includes(message.toLowerCase().slice(0, 20))) {
          score = 0.25;
        } else if (file.name.toLowerCase().includes(message.toLowerCase().slice(0, 15))) {
          score = 0.2;
        }
        allChunks.push({ text: chunk.text, filename: file.name, score });
      }
    }

    const relevant = allChunks.sort((a, b) => b.score - a.score).slice(0, 6).filter((c) => c.score > 0.1);

    // Build code context — always include file list as overview
    const fileList = files.map((f) => `- ${f.path} (${(f.size / 1024).toFixed(1)}KB)`).join("\n");
    const codeContext = relevant.length > 0
      ? relevant.map((c) => `\`\`\`\n// File: ${c.filename}\n${c.text}\n\`\`\``).join("\n\n")
      : files.slice(0, 3).map((f) => `\`\`\`\n// File: ${f.name}\n${f.content}\n\`\`\``).join("\n\n");

    const conversationHistory = (history || [])
      .slice(-6)
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt = `You are an expert AI coding assistant similar to Cursor. You have access to the user's codebase.
Help them understand, improve, debug, and refactor their code.

CODEBASE OVERVIEW (${files.length} files):
${fileList}

RELEVANT CODE CONTEXT:
${codeContext}

${conversationHistory ? `CONVERSATION HISTORY:\n${conversationHistory}\n` : ""}

User: ${message}

Provide clear, actionable answers. When suggesting code changes, always show the modified code in a code block with the filename as a comment. Use the actual file names from the codebase.`;

    const response = await callLLM(prompt, 90000);

    return NextResponse.json({ message: response }, { status: 200 });
  } catch (e) {
    console.error("Coding chat error:", e);
    return NextResponse.json({ message: "Failed to generate response" }, { status: 500 });
  }
}
