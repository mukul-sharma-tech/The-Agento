import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Document from "@/models/Document";
import VectorChunk from "@/models/VectorChunk";

const CATEGORIES = [
  "HR",
  "Engineering",
  "Sales",
  "Marketing",
  "Finance",
  "Legal",
  "Operations",
  "General",
];

function isGoodText(line: string): boolean {
  const txt = line.trim();
  if (txt.length < 10) return false;
  
  const alphaNum = txt.replace(/[^a-zA-Z0-9]/g, "");
  if (alphaNum.length / txt.length < 0.4) return false;
  
  const words = txt.match(/[a-zA-Z]{3,}/g);
  if (!words || words.length < 2) return false;
  
  return true;
}

function cleanText(text: string): string {
  const lines = text.split(/\r?\n/);
  const good: string[] = [];
  
  for (const line of lines) {
    if (isGoodText(line)) {
      good.push(line.trim());
    }
  }
  
  return good.join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

function chunkText(text: string, size = 1000, overlap = 200): string[] {
  if (!text || text.length < 50) return [];
  
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  let current = "";
  
  for (const word of words) {
    if ((current + " " + word).length > size) {
      if (current) chunks.push(current.trim());
      const w = current.split(/\s+/);
      current = w.slice(-Math.floor(overlap / 5)).join(" ") + " " + word;
    } else {
      current += (current ? " " : "") + word;
    }
  }
  if (current) chunks.push(current.trim());
  
  return chunks;
}

async function getEmbedding(text: string): Promise<number[]> {
  const url = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";
  
  try {
    const res = await fetch(`${url}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: text }),
    });

    if (!res.ok) throw new Error(`Embed error: ${res.status}`);
    const data = await res.json();
    return data.embedding || [];
  } catch (e) {
    console.error("Embed error:", e);
    throw e;
  }
}

async function getFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv") || name.endsWith(".json")) {
    return await file.text();
  }
  
  if (name.endsWith(".pdf")) {
    const txt = await file.text();
    return cleanText(txt);
  }
  
  return await file.text();
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    if (session.user.role !== "admin") return NextResponse.json({ message: "Only admins" }, { status: 403 });

    const docs = await Document.find({ company_id: session.user.company_id })
      .sort({ upload_date: -1 })
      .select("filename category uploaded_by upload_date");

    return NextResponse.json({ documents: docs }, { status: 200 });
  } catch (e) {
    console.error("Get error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ message: "Only admins" }, { status: 403 });

    const form = await req.formData();
    const file = form.get("file") as File;
    const category = form.get("category") as string;

    if (!file) return NextResponse.json({ message: "No file" }, { status: 400 });
    if (!category || !CATEGORIES.includes(category)) return NextResponse.json({ message: "Invalid category" }, { status: 400 });

    const name = file.name.toLowerCase();
    const valid = [".txt", ".md", ".pdf", ".csv", ".json"];
    if (!valid.some(ext => name.endsWith(ext))) return NextResponse.json({ message: "Invalid type" }, { status: 400 });

    await connectDB();

    const fullTxt = await getFileText(file);
    const cleaned = cleanText(fullTxt);

    console.log(`Extracted: ${cleaned.length} chars`);
    console.log(`Preview: ${cleaned.substring(0, 300)}`);

    if (!cleaned.trim() || cleaned.length < 50) {
      return NextResponse.json({ 
        message: "Could not extract readable text. Please convert PDF to text file first." 
      }, { status: 400 });
    }

    const uploadedBy = session.user.email || session.user.name || "Unknown";
    const companyId = session.user.company_id;

    const doc = await Document.create({
      company_id: companyId,
      filename: file.name,
      category,
      uploaded_by: uploadedBy,
      upload_date: new Date(),
      full_text: cleaned,
      file_url: `/uploads/${companyId}/${file.name}`,
    });

    const chunks = chunkText(cleaned);
    console.log(`Chunks: ${chunks.length}`);

    if (chunks.length === 0) return NextResponse.json({ message: "No content" }, { status: 400 });

    const vectors: Array<{
      metadata: { company_id: string; category: string; filename: string; uploaded_by: string };
      textContent: string;
      vectorContent: number[];
    }> = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const emb = await getEmbedding(chunk);
        if (emb.length > 0) {
          vectors.push({
            metadata: { company_id: companyId, category, filename: file.name, uploaded_by: uploadedBy },
            textContent: chunk,
            vectorContent: emb,
          });
        }
      } catch {
        console.warn(`Embed fail chunk ${i}`);
      }
    }

    if (vectors.length === 0) return NextResponse.json({ message: "No embeddings" }, { status: 500 });

    await VectorChunk.insertMany(vectors);
    console.log(`Stored ${vectors.length} vectors`);

    return NextResponse.json({
      message: "Uploaded",
      document: { id: (doc as any)._id, filename: doc.filename, category: doc.category, chunks: vectors.length },
    }, { status: 201 });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

export { CATEGORIES };
