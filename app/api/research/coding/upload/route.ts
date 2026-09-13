import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getEmbedding } from "@/lib/llm";

const STORE_KEY = "__coding_sessions__";

type CodeChunk = { text: string; embedding: number[]; model: string };
type CodeFile = { name: string; path: string; size: number; content: string; chunks: CodeChunk[] };
type SessionMap = Map<string, CodeFile[]>;

function getStore(): SessionMap {
  const g = global as unknown as Record<string, SessionMap>;
  if (!g[STORE_KEY]) g[STORE_KEY] = new Map<string, CodeFile[]>();
  return g[STORE_KEY];
}

function chunkCode(text: string, size = 600, overlap = 100): string[] {
  const lines = text.split("\n");
  const chunks: string[] = [];
  let current: string[] = [];
  let charCount = 0;

  for (const line of lines) {
    current.push(line);
    charCount += line.length + 1;
    if (charCount > size) {
      chunks.push(current.join("\n"));
      const overlap_lines = Math.max(1, Math.floor(overlap / 30));
      current = current.slice(-overlap_lines);
      charCount = current.reduce((s, l) => s + l.length + 1, 0);
    }
  }
  if (current.length > 0) chunks.push(current.join("\n"));
  return chunks;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const sessionId = form.get("sessionId") as string;
    const files = form.getAll("files") as File[];

    if (!sessionId || !files.length) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const store = getStore();
    const codeFiles: CodeFile[] = [];

    for (const file of files) {
      if (file.size > 100 * 1024) continue; // skip >100KB
      const content = await file.text();
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

      // Chunk + embed
      const textChunks = chunkCode(content);
      const embeddedChunks: CodeChunk[] = [];

      for (const chunk of textChunks.slice(0, 10)) { // max 10 chunks per file
        try {
          const { embedding, model } = await getEmbedding(`File: ${file.name}\n${chunk}`);
          embeddedChunks.push({ text: chunk, embedding, model });
        } catch {
          embeddedChunks.push({ text: chunk, embedding: [], model: "" });
        }
      }

      codeFiles.push({
        name: file.name,
        path: relativePath,
        size: file.size,
        content: content.slice(0, 2000), // preview only
        chunks: embeddedChunks,
      });
    }

    store.set(sessionId, codeFiles);

    return NextResponse.json({
      files: codeFiles.map((f) => ({ name: f.name, path: f.path, size: f.size, content: f.content })),
    }, { status: 201 });
  } catch (e) {
    console.error("Coding upload error:", e);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const path = url.searchParams.get("path");
    const sessionId = url.searchParams.get("sessionId");
    if (!path || !sessionId) return NextResponse.json({ message: "Missing params" }, { status: 400 });

    const store = getStore();
    const files = store.get(sessionId) || [];
    store.set(sessionId, files.filter((f) => f.path !== path));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Coding delete error:", e);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}

export { getStore as getCodingStore };
