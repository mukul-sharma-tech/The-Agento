"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, PenTool, Bot, User, Send, Loader2,
  PlusCircle, MessageSquare, Trash2, Clock,
  PanelLeftClose, PanelLeftOpen, Upload, FileText,
  X, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string; }

interface SessionMeta {
  _id: string;
  title: string;
  updatedAt: string;
  messages: { role: string }[];
}

interface SampleMeta {
  sampleId: string;
  filename: string;
  words: number;
  uploadedAt: string;
}

// ─── Inline bold/italic parser ────────────────────────────────────────────────
function renderInline(text: string, isUser: boolean): React.ReactNode[] {
  const parts = text.split(/(\*\*[\s\S]+?\*\*|\*[^*]+\*)/g);
  const hc = isUser ? "text-white" : "text-slate-800";
  return parts.filter(p => p !== "").map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className={`font-semibold ${hc}`}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function MarkdownContent({ content, isUser = false }: { content: string; isUser?: boolean }) {
  const tc = isUser ? "text-white"   : "text-slate-700";
  const hc = isUser ? "text-white"   : "text-slate-800";
  const cc = isUser ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800";
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) { i++; while (i < lines.length && !lines[i].startsWith("```")) i++; i++; continue; }
    if (line.startsWith("### ")) { nodes.push(<h3 key={i} className={`text-sm font-semibold mt-3 mb-1 ${hc}`}>{renderInline(line.slice(4), isUser)}</h3>); i++; continue; }
    if (line.startsWith("## "))  { nodes.push(<h2 key={i} className={`text-base font-semibold mt-4 mb-2 ${hc}`}>{renderInline(line.slice(3), isUser)}</h2>); i++; continue; }
    if (line.startsWith("# "))   { nodes.push(<h1 key={i} className={`text-lg font-bold mt-4 mb-2 ${hc}`}>{renderInline(line.slice(2), isUser)}</h1>); i++; continue; }
    if (line.match(/^-{3,}$/) || line.match(/^\*{3,}$/)) { nodes.push(<hr key={i} className="my-3 border-slate-200" />); i++; continue; }
    if (line.match(/^[•\-\*]\s/)) { nodes.push(<li key={i} className={`ml-5 mb-1 list-disc ${tc}`}>{renderInline(line.replace(/^[•\-\*]\s/, ""), isUser)}</li>); i++; continue; }
    if (line.match(/^\d+\.\s/))   { nodes.push(<li key={i} className={`ml-5 mb-1 list-decimal ${tc}`}>{renderInline(line.replace(/^\d+\.\s/, ""), isUser)}</li>); i++; continue; }
    if (line.includes("`")) {
      const parts = line.split(/(`[^`]+`)/g);
      nodes.push(<p key={i} className={`mb-2 ${tc}`}>{parts.map((p, pi) =>
        p.startsWith("`") && p.endsWith("`") && p.length > 2
          ? <code key={pi} className={`font-mono text-xs px-1 py-0.5 rounded ${cc}`}>{p.slice(1,-1)}</code>
          : <span key={pi}>{renderInline(p, isUser)}</span>
      )}</p>);
      i++; continue;
    }
    if (line.trim() === "") { nodes.push(<div key={i} className="h-1.5" />); i++; continue; }
    nodes.push(<p key={i} className={`mb-2 ${tc}`}>{renderInline(line, isUser)}</p>);
    i++;
  }
  return <div className="leading-relaxed">{nodes}</div>;
}

// ─── Time formatter ───────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)    return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HumanWriterPage() {
  const { status } = useSession();
  const router = useRouter();

  // Layout
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [samplesOpen, setSamplesOpen]   = useState(true);

  // Sessions (chat history)
  const [sessions, setSessions]         = useState<SessionMeta[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  // Writing samples (global)
  const [samples, setSamples]           = useState<SampleMeta[]>([]);
  const [samplesLoading, setSamplesLoading] = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState("");
  const [styleAnalysis, setStyleAnalysis] = useState("");
  const [deletingSampleId, setDeletingSampleId] = useState<string | null>(null);

  // Chat
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const chatRef    = useRef<HTMLDivElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setSidebarOpen(false);
  }, []);
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  // ── Load writing profile ──────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setSamplesLoading(true);
    try {
      const res = await fetch("/api/research/human-writer/profile");
      if (res.ok) {
        const data = await res.json();
        setSamples(data.samples || []);
        setStyleAnalysis(data.styleAnalysis || "");
      }
    } finally { setSamplesLoading(false); }
  }, []);

  // ── Load chat sessions ────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/research/human-writer/sessions");
      if (res.ok) { const d = await res.json(); setSessions(d.sessions || []); }
    } finally { setSessionsLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "authenticated") { fetchProfile(); fetchSessions(); }
  }, [status, fetchProfile, fetchSessions]);

  // ── Upload a writing sample ───────────────────────────────────────────────
  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true); setUploadError("");
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["txt", "md"].includes(ext || "")) { setUploadError("Only .txt and .md files"); continue; }
      const fd = new FormData(); fd.append("file", file);
      try {
        const res = await fetch("/api/research/human-writer/profile", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) {
          setSamples(prev => [...prev, { sampleId: data.sampleId, filename: data.filename, words: data.words, uploadedAt: new Date().toISOString() }]);
        } else { setUploadError(data.message || `Failed: ${file.name}`); }
      } catch { setUploadError(`Upload failed: ${file.name}`); }
    }
    setUploading(false);
    // Refresh to get updated style analysis
    setTimeout(fetchProfile, 3000);
  };

  // ── Delete a writing sample ───────────────────────────────────────────────
  const deleteSample = async (sampleId: string) => {
    setDeletingSampleId(sampleId);
    await fetch(`/api/research/human-writer/profile?sampleId=${sampleId}`, { method: "DELETE" });
    setSamples(prev => prev.filter(s => s.sampleId !== sampleId));
    setDeletingSampleId(null);
    setTimeout(fetchProfile, 2000);
  };

  // ── Create new chat session ───────────────────────────────────────────────
  const createNewChat = async () => {
    const res = await fetch("/api/research/human-writer/sessions", { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setSessions(prev => [d.session, ...prev]);
      setActiveSessionId(d.session._id);
      setMessages([]);
      setError("");
      if (typeof window !== "undefined" && window.innerWidth < 768) setSidebarOpen(false);
    }
  };

  // ── Load a past session ───────────────────────────────────────────────────
  const loadSession = async (id: string) => {
    setActiveSessionId(id);
    setError("");
    const res = await fetch(`/api/research/human-writer/sessions/${id}`);
    if (res.ok) {
      const d = await res.json();
      setMessages((d.session.messages || []).map((m: { role: "user"|"assistant"; content: string }) => ({
        role: m.role, content: m.content,
      })));
      if (typeof window !== "undefined" && window.innerWidth < 768) setSidebarOpen(false);
    }
  };

  // ── Delete a session ──────────────────────────────────────────────────────
  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;
    setDeletingId(id);
    await fetch(`/api/research/human-writer/sessions/${id}`, { method: "DELETE" });
    setSessions(prev => prev.filter(s => s._id !== id));
    if (activeSessionId === id) { setActiveSessionId(null); setMessages([]); }
    setDeletingId(null);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Auto-create session
    let sessionId = activeSessionId;
    if (!sessionId) {
      const res = await fetch("/api/research/human-writer/sessions", { method: "POST" });
      if (!res.ok) return;
      const d = await res.json();
      sessionId = d.session._id;
      setActiveSessionId(sessionId);
      setSessions(prev => [d.session, ...prev]);
    }

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/research/human-writer/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: messages.slice(-8) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to get response");
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
        // Persist
        await fetch(`/api/research/human-writer/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMessage: userMsg, assistantMessage: data.message }),
        });
        fetchSessions();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
    </main>
  );

  return (
    <main className="relative h-screen overflow-hidden flex flex-col bg-slate-100">

      {/* ── Backgrounds ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-white to-rose-50 pointer-events-none" />
      <div className="absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px] bg-rose-300/30 pointer-events-none" />
      <div className="absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px] bg-pink-300/25 pointer-events-none" />

      {/* ── Header ── */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200/50 bg-white/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/research")} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-all"
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <PenTool className="w-5 h-5 text-rose-500" />
          <h1 className="text-base font-semibold text-slate-800">Human Writer</h1>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex justify-center"><div className="w-10 h-10 bg-rose-400/20 rounded-full blur-[20px]" /></div>
          <Image src="/logo.png" alt="Logo" width={100} height={57} className="relative z-10 opacity-80" />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="absolute inset-0 z-10 bg-slate-900/20 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ══════════════════════════════════════
            SIDEBAR
        ══════════════════════════════════════ */}
        <aside className={`absolute md:static z-20 h-full flex-shrink-0 flex flex-col border-r border-slate-200/60 bg-white drop-shadow-xl md:drop-shadow-none md:bg-white/40 backdrop-blur-xl overflow-hidden transition-all duration-300 ${sidebarOpen ? "w-72" : "w-0 border-r-0"}`}>

          {/* ── New Chat button ── */}
          <div className="p-3 border-b border-slate-200/60">
            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-all"
            >
              <PlusCircle className="w-4 h-4" /> New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* ── Writing Samples Section ── */}
            <div className="border-b border-slate-200/60">
              {/* Collapsible header */}
              <button
                onClick={() => setSamplesOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <PenTool className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Writing Style
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-semibold">
                    {samples.length}
                  </span>
                </div>
                {samplesOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {samplesOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {/* Upload button */}
                  <label className="flex items-center justify-center gap-2 w-full h-8 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-rose-300 hover:text-rose-500 text-xs font-medium cursor-pointer transition-all">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploading ? "Uploading..." : "Upload .txt / .md"}
                    <input ref={fileRef} type="file" accept=".txt,.md" multiple className="hidden"
                      onChange={e => handleUpload(e.target.files)} disabled={uploading} />
                  </label>
                  {uploadError && <p className="text-[10px] text-red-500">{uploadError}</p>}

                  {samplesLoading && <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>}

                  {!samplesLoading && samples.length === 0 && (
                    <div className="text-center py-3">
                      <FileText className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                      <p className="text-[10px] text-slate-400">No samples yet</p>
                      <p className="text-[10px] text-slate-400">Upload your writing so I can match your style globally</p>
                    </div>
                  )}

                  {samples.map(s => (
                    <div key={s.sampleId} className="group flex items-center gap-2 px-2.5 py-2 rounded-lg border border-transparent hover:bg-slate-100/70 hover:border-slate-200 transition-all">
                      <FileText className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{s.filename}</p>
                        <p className="text-[10px] text-slate-400">{s.words.toLocaleString()} words</p>
                      </div>
                      <button
                        onClick={() => deleteSample(s.sampleId)}
                        disabled={deletingSampleId === s.sampleId}
                        className="p-0.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all rounded"
                      >
                        {deletingSampleId === s.sampleId
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <X className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}

                  {/* Style analysis preview */}
                  {styleAnalysis && (
                    <div className="mt-1 p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                      <p className="text-[10px] font-semibold text-rose-600 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Style Detected
                      </p>
                      <p className="text-[10px] text-rose-500 leading-relaxed line-clamp-4">{styleAnalysis}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Chat History ── */}
            <div className="p-2 space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5">History</p>

              {sessionsLoading && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>}

              {!sessionsLoading && sessions.length === 0 && (
                <div className="text-center py-6">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500">No chats yet</p>
                </div>
              )}

              {sessions.map(s => (
                <div
                  key={s._id}
                  onClick={() => loadSession(s._id)}
                  className={`group flex items-start justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                    activeSessionId === s._id
                      ? "bg-rose-50 border border-rose-200"
                      : "hover:bg-slate-100/70 border border-transparent"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.title}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />{timeAgo(s.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={e => deleteSession(s._id, e)}
                    disabled={deletingId === s._id}
                    className="ml-1 p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0 mt-0.5"
                  >
                    {deletingId === s._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ══════════════════════════════════════
            CHAT AREA
        ══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
                <PenTool className="w-16 h-16 text-slate-400" />
                <h2 className="text-2xl font-semibold text-slate-800">
                  {samples.length > 0 ? "Write anything in your voice" : "Your AI ghostwriter"}
                </h2>
                <p className="text-slate-500 max-w-md text-sm">
                  {samples.length > 0
                    ? `I've learned your writing style from ${samples.length} sample${samples.length > 1 ? "s" : ""}. Ask me to write anything — emails, posts, essays — and I'll match your exact voice.`
                    : "Upload your writing samples in the left panel. I'll learn your style and write content that sounds exactly like you."}
                </p>
                {samples.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      "Write a LinkedIn post about AI",
                      "Draft a professional email declining a meeting",
                      "Write a blog intro about productivity",
                      "Explain quantum computing simply",
                    ].map(q => (
                      <button key={q} onClick={() => setInput(q)}
                        className="px-3 py-2 rounded-xl bg-white/70 border border-slate-200 text-xs text-slate-600 hover:border-rose-300 hover:text-rose-600 transition-all text-left">
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
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-rose-500" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isUser
                      ? "bg-slate-800 text-white"
                      : "bg-white/70 backdrop-blur-xl border border-slate-200/50"
                  }`}>
                    <MarkdownContent content={msg.content} isUser={isUser} />
                  </div>
                  {isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-rose-500" />
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

          {/* Input bar */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm">
            {samples.length === 0 && (
              <p className="text-xs text-slate-400 text-center mb-2">
                Tip: Upload writing samples in the sidebar so I can match your style
              </p>
            )}
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={samples.length > 0 ? "Ask me to write anything — in your voice..." : "Ask me anything..."}
                disabled={loading}
                className="flex-1 h-12 px-4 rounded-xl bg-white/50 border border-slate-200/50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
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
