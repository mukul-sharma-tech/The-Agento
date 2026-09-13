import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { callLLM, getEmbedding } from "@/lib/llm";
import { getNotebookStore } from "../upload/route";

function cosine(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { message, history, sessionId } = await req.json();
    if (!message || !sessionId) return NextResponse.json({ message: "Missing fields" }, { status: 400 });

    const store = getNotebookStore();
    const docs = store.get(sessionId);
    if (!docs || docs.length === 0) {
      return NextResponse.json({ message: "No documents uploaded for this session." }, { status: 400 });
    }

    // Get query embedding
    let queryEmb: number[] = [];
    let queryModel = "";
    try {
      const r = await getEmbedding(message);
      queryEmb = r.embedding;
      queryModel = r.model;
    } catch { /* fallback to text search */ }

    // Gather all chunks from all docs, score them
    const allChunks: { text: string; filename: string; score: number }[] = [];
    for (const doc of docs) {
      for (const chunk of doc.chunks) {
        let score = 0;
        if (queryEmb.length > 0 && chunk.embedding.length > 0 && chunk.model === queryModel) {
          score = cosine(queryEmb, chunk.embedding);
        } else if (chunk.text.toLowerCase().includes(message.toLowerCase().slice(0, 30))) {
          score = 0.3;
        }
        allChunks.push({ text: chunk.text, filename: doc.filename, score });
      }
    }

    // Top 6 relevant chunks
    const relevant = allChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .filter((c) => c.score > 0.1);

    const context = relevant.map((c) => `[${c.filename}]\n${c.text}`).join("\n\n---\n\n");
    const citations = [...new Set(relevant.map((c) => c.filename))];

    const conversationHistory = (history || [])
      .slice(-6)
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      )
      .join("\n");

    const prompt = `You are Notebook LLM, an AI assistant that answers questions based on uploaded documents.
Answer the user's question using ONLY the provided document context. Always cite which document contains the information.
If the context does not have the answer, say so clearly.

DOCUMENT CONTEXT:
${context || "No relevant content found in the uploaded documents."}

${conversationHistory ? `CONVERSATION HISTORY:\n${conversationHistory}\n` : ""}
User: ${message}

Provide a clear, detailed answer. Reference document names in your answer when citing sources.`;

    const response = await callLLM(prompt);

    return NextResponse.json({ message: response, citations }, { status: 200 });
  } catch (e) {
    console.error("Notebook chat error:", e);
    return NextResponse.json({ message: "Failed to generate response" }, { status: 500 });
  }
}
