"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, BookOpen, Bot, User, Send, Loader2,
  Upload, FileText, Trash2, PlusCircle, X,
  PanelLeftClose, PanelLeftOpen, MessageSquare, Clock,
} from "lucide-react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
}

interface NotebookDoc {
  docId: string;
  filename: string;
  chunks: number;
  size: number;
}

interface NotebookData {
  _id: string;
  title: string;
  description: string;
  docs: NotebookDoc[];
  messages: Message[];
}

// ─── Inline bold/italic parser ────────────────────────────────────────────────
function renderInline(text: string, isUser: boolean): React.ReactNode[] {
  const parts = text.split(/(\*\*[\s\S]+?\*\*|\*[^*]+\*)/g);
  const headingColor = isUser ? "text-white" : "text-slate-800";
  return parts.filter(p => p !== "").map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={idx} className={`font-semibold ${headingColor}`}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={idx}>{part.slice(1, -1)}</em>;
    return <span key={idx}>{part}</span>;
  });
}

// ─── Markdown renderer - mirrors chat page exactly ────────────────────────────
function MarkdownContent({ content, isUser = false }: { content: string; isUser?: boolean }) {
  const textColor  = isUser ? "text-white"      : "text-slate-700";
  const headColor  = isUser ? "text-white"      : "text-slate-800";
  const codeColor  = isUser ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800";

  const lines  = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // skip raw code fences
    if (line.startsWith("```")) { i++; while (i < lines.length && !lines[i].startsWith("```")) i++; i++; continue; }

    if (line.startsWith("### "))
      { nodes.push(<h3 key={i} className={`text-sm font-semibold mt-3 mb-1 ${headColor}`}>{renderInline(line.slice(4), isUser)}</h3>); i++; continue; }
    if (line.startsWith("## "))
      { nodes.push(<h2 key={i} className={`text-base font-semibold mt-4 mb-2 ${headColor}`}>{renderInline(line.slice(3), isUser)}</h2>); i++; continue; }
    if (line.startsWith("# "))
      { nodes.push(<h1 key={i} className={`text-lg font-bold mt-4 mb-2 ${headColor}`}>{renderInline(line.slice(2), isUser)}</h1>); i++; continue; }

    // HR
    if (line.match(/^-{3,}$/) || line.match(/^\*{3,}$/))
      { nodes.push(<hr key={i} className="my-3 border-slate-200" />); i++; continue; }

    // Bullet list
    if (line.match(/^[•\-\*]\s/))
      { nodes.push(<li key={i} className={`ml-5 mb-1 list-disc ${textColor}`}>{renderInline(line.replace(/^[•\-\*]\s/, ""), isUser)}</li>); i++; continue; }

    // Numbered list
    if (line.match(/^\d+\.\s/))
      { nodes.push(<li key={i} className={`ml-5 mb-1 list-decimal ${textColor}`}>{renderInline(line.replace(/^\d+\.\s/, ""), isUser)}</li>); i++; continue; }

    // Inline code
    if (line.includes("`")) {
      const parts = line.split(/(`[^`]+`)/g);
      nodes.push(
        <p key={i} className={`mb-2 ${textColor}`}>
          {parts.map((p, pi) =>
            p.startsWith("`") && p.endsWith("`") && p.length > 2
              ? <code key={pi} className={`font-mono text-xs px-1 py-0.5 rounded ${codeColor}`}>{p.slice(1, -1)}</code>
              : <span key={pi}>{renderInline(p, isUser)}</span>
          )}
        </p>
      );
      i++; continue;
    }

    if (line.trim() === "") { nodes.push(<div key={i} className="h-1.5" />); i++; continue; }

    nodes.push(<p key={i} className={`mb-2 ${textColor}`}>{renderInline(line, isUser)}</p>);
    i++;
  }
  return <div className="leading-relaxed">{nodes}</div>;
}

// ─── Main chat page ───────────────────────────────────────────────────────────
export default function NotebookChatPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const notebookId = params.id;

  const [notebook, setNotebook]   = useState<NotebookData | null>(null);
  const [nbLoading, setNbLoading] = useState(true);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  // Load notebook data
  const loadNotebook = useCallback(async () => {
    if (!notebookId) return;
    setNbLoading(true);
    try {
      const res = await fetch(`/api/research/notebook/sessions/${notebookId}`);
      if (res.ok) {
        const data = await res.json();
        setNotebook(data.notebook);
        setMessages(data.notebook.messages || []);
      } else {
        router.push("/research/notebook");
      }
    } finally {
      setNbLoading(false);
    }
  }, [notebookId, router]);

  useEffect(() => { if (status === "authenticated") loadNotebook(); }, [status, loadNotebook]);

  // Upload a document
  const handleUpload = async (files: FileList | null) => {
    if (!files || !notebookId) return;
    setUploading(true);
    setUploadError("");

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "txt", "md"].includes(ext || "")) {
        setUploadError(`Unsupported: ${file.name}`);
        continue;
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("sessionId", notebookId); // use notebookId as the in-memory key

      try {
        const res = await fetch("/api/research/notebook/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) {
          // Persist doc reference to DB via PATCH
          await fetch(`/api/research/notebook/sessions/${notebookId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              addDoc: {
                docId: data.id,
                filename: file.name,
                chunks: data.chunks,
                size: file.size,
              },
            }),
          });
          setNotebook(prev => prev ? {
            ...prev,
            docs: [...prev.docs, { docId: data.id, filename: file.name, chunks: data.chunks, size: file.size }],
          } : prev);
        } else {
          setUploadError(data.message || `Failed: ${file.name}`);
        }
      } catch {
        setUploadError(`Upload failed: ${file.name}`);
      }
    }
    setUploading(false);
  };

  // Remove a document
  const removeDoc = async (docId: string) => {
    if (!notebookId) return;
    setDeletingDocId(docId);
    // Remove from in-memory store
    await fetch(`/api/research/notebook/upload?id=${docId}&sessionId=${notebookId}`, { method: "DELETE" });
    // Remove from DB
    await fetch(`/api/research/notebook/sessions/${notebookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeDocId: docId }),
    });
    setNotebook(prev => prev ? { ...prev, docs: prev.docs.filter(d => d.docId !== docId) } : prev);
    setDeletingDocId(null);
  };

  // Send a chat message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !notebookId) return;
    if (!notebook?.docs.length) { setError("Upload at least one document first."); return; }

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/research/notebook/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: messages.slice(-6), sessionId: notebookId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to get a response");
      } else {
        const aMsg: Message = { role: "assistant", content: data.message, citations: data.citations || [] };
        setMessages(prev => [...prev, aMsg]);

        // Persist to DB
        await fetch(`/api/research/notebook/sessions/${notebookId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMessage: userMsg, assistantMessage: data.message, citations: data.citations }),
        });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  if (status === "loading" || nbLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </main>
    );
  }

  return (
    <main className="relative h-screen overflow-hidden flex flex-col bg-slate-100">

      {/* ── Backgrounds - exact match to chat page ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-white to-blue-100 pointer-events-none" />
      <div className="absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px] bg-blue-300/40 pointer-events-none" />
      <div className="absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px] bg-indigo-300/35 pointer-events-none" />

      {/* ── Header ── */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200/50 bg-white/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/research/notebook")}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Notebooks
          </button>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-all"
            title="Toggle sources"
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <h1 className="text-base font-semibold text-slate-800 max-w-[200px] truncate">
            {notebook?.title ?? "Notebook"}
          </h1>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex justify-center">
            <div className="w-10 h-10 bg-blue-400/20 rounded-full blur-[20px]" />
          </div>
          <Image src="/logo.png" alt="Logo" width={100} height={57} className="relative z-10 opacity-80" />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-10 bg-slate-900/20 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── SOURCES SIDEBAR ── */}
        <aside className={`absolute md:static z-20 h-full flex-shrink-0 flex flex-col border-r border-slate-200/60 bg-white drop-shadow-xl md:drop-shadow-none md:bg-white/40 backdrop-blur-xl overflow-hidden transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0 border-r-0"}`}>

          {/* Upload button */}
          <div className="p-3 border-b border-slate-200/60">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-all"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              {uploading ? "Uploading..." : "Add Source"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              multiple
              className="hidden"
              onChange={e => handleUpload(e.target.files)}
            />
            {uploadError && <p className="mt-1.5 text-xs text-red-500">{uploadError}</p>}
          </div>

          {/* Sources list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5">
              Sources ({notebook?.docs.length ?? 0})
            </p>

            {notebook?.docs.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-500">No sources yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Add a PDF, TXT or MD file</p>
              </div>
            )}

            {notebook?.docs.map(doc => (
              <div
                key={doc.docId}
                className="group flex items-start gap-2 px-3 py-2.5 rounded-lg border border-transparent hover:bg-slate-100/70 hover:border-slate-200 transition-all"
              >
                <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.filename}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {doc.chunks} chunks · {formatSize(doc.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeDoc(doc.docId)}
                  disabled={deletingDocId === doc.docId}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                >
                  {deletingDocId === doc.docId
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="p-3 border-t border-slate-200/60">
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-2.5">
              <p className="text-[10px] font-semibold text-indigo-700 mb-1">Tips</p>
              <ul className="text-[10px] text-indigo-600 space-y-0.5">
                <li>• Upload multiple docs for cross-source answers</li>
                <li>• Supports PDF, TXT, Markdown</li>
                <li>• All messages are saved automatically</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* ── CHAT AREA ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
                <Bot className="w-16 h-16 text-slate-400" />
                <h2 className="text-2xl font-semibold text-slate-800">
                  {notebook?.docs.length
                    ? "Ask anything about your sources"
                    : "Add a source to get started"}
                </h2>
                <p className="text-slate-500 max-w-md text-sm">
                  {notebook?.docs.length
                    ? "I'll search across all your uploaded documents and cite exactly where I found the answer."
                    : "Click \"Add Source\" in the left panel to upload a PDF, TXT, or Markdown file."}
                </p>
                {notebook && notebook.docs.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["Summarize the key findings", "What are the main arguments?", "Compare the documents", "Find key quotes about..."].map(q => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="px-3 py-2 rounded-xl bg-white/70 border border-slate-200 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div key={idx} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-blue-500" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isUser
                      ? "bg-slate-800 text-white"
                      : "bg-white/70 backdrop-blur-xl border border-slate-200/50"
                  }`}>
                    <MarkdownContent content={msg.content} isUser={isUser} />

                    {/* Citations */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                        {msg.citations.map((c, ci) => (
                          <span key={ci} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">
                            <FileText className="w-3 h-3 flex-shrink-0" />{c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading dots */}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-500" />
                </div>
                <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 text-red-600 rounded-lg px-4 py-2 text-sm">{error}</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  !notebook?.docs.length
                    ? "Add a source document first..."
                    : "Ask anything about your sources..."
                }
                disabled={loading || !notebook?.docs.length}
                className="flex-1 h-12 px-4 rounded-xl bg-white/50 border border-slate-200/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || !notebook?.docs.length}
                className="h-12 px-6 rounded-xl bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
