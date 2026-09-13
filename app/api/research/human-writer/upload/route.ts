import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

    const form = await req.formData();
    const file = form.get("file") as File;
    const sessionId = form.get("sessionId") as string;

    if (!file || !sessionId) return NextResponse.json({ message: "Missing fields" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["txt", "md"].includes(ext || "")) {
      return NextResponse.json({ message: "Only .txt and .md files supported" }, { status: 400 });
    }
    if (file.size > 500 * 1024) {
      return NextResponse.json({ message: "File too large (max 500KB)" }, { status: 400 });
    }

    const content = await file.text();
    const sampleId = `sample-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const store = getStore();
    const existing = store.get(sessionId) || [];
    store.set(sessionId, [...existing, { id: sampleId, filename: file.name, content }]);

    return NextResponse.json({ id: sampleId, words: content.split(/\s+/).length }, { status: 201 });
  } catch (e) {
    console.error("HW upload error:", e);
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

    const store = getStore();
    const samples = store.get(sessionId) || [];
    store.set(sessionId, samples.filter((s) => s.id !== id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("HW delete error:", e);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}

export { getStore as getHWStore };
