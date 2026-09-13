import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getEmbedding } from "@/lib/llm";

export const NOTEBOOK_STORE_KEY = "__notebook_sessions__";
type ChunkEntry = { text: string; embedding: number[]; model: string };
type DocEntry = { id: string; filename: string; chunks: ChunkEntry[] };
type SessionMap = Map<string, DocEntry[]>;

export function getNotebookStore(): SessionMap {
  const g = global as unknown as Record<string, SessionMap>;
  if (!g[NOTEBOOK_STORE_KEY]) g[NOTEBOOK_STORE_KEY] = new Map<string, DocEntry[]>();
  return g[NOTEBOOK_STORE_KEY];
}

function chunkText(text: string, size = 800, overlap = 150): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).length > size && current) {
      chunks.push(current.trim());
      const tail = current.split(/\s+/).slice(-Math.floor(overlap / 5));
      current = tail.join(" ") + " " + word;
    } else {
      current += (current ? " " : "") + word;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    try {
      const { extractText: pdfExtract, getDocumentProxy } = await import("unpdf");
      const buffer = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocumentProxy(buffer);
      const { text } = await pdfExtract(pdf, { mergePages: true });
      return Array.isArray(text) ? text.join(" ") : text;
    } catch {
      return await file.text();
    }
  }
  return await file.text();
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file") as File;
    const sessionId = form.get("sessionId") as string;

    if (!file || !sessionId) return NextResponse.json({ message: "Missing file or sessionId" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "txt", "md"].includes(ext || "")) {
      return NextResponse.json({ message: "Unsupported file type. Use PDF, TXT, or MD." }, { status: 400 });
    }

    const rawText = await extractText(file);
    const cleaned = rawText.replace(/\s+/g, " ").trim();

    if (cleaned.length < 50) {
      return NextResponse.json({ message: "Could not extract readable text from this file." }, { status: 400 });
    }

    const textChunks = chunkText(cleaned);
    const embeddedChunks: ChunkEntry[] = [];

    for (const chunk of textChunks) {
      try {
        const { embedding, model } = await getEmbedding(chunk);
        embeddedChunks.push({ text: chunk, embedding, model });
      } catch {
        embeddedChunks.push({ text: chunk, embedding: [], model: "" });
      }
    }

    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const store = getNotebookStore();
    const existing = store.get(sessionId) || [];
    store.set(sessionId, [...existing, { id: docId, filename: file.name, chunks: embeddedChunks }]);

    return NextResponse.json({ id: docId, chunks: embeddedChunks.length }, { status: 201 });
  } catch (e) {
    console.error("Notebook upload error:", e);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const sessionId = url.searchParams.get("sessionId");

    if (!id || !sessionId) return NextResponse.json({ message: "Missing params" }, { status: 400 });

    const store = getNotebookStore();
    const docs = store.get(sessionId) || [];
    store.set(sessionId, docs.filter((d) => d.id !== id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Notebook delete error:", e);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
