"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Send, Bot, User, ArrowLeft, Zap, X, FileImage, FileText,
  PlusCircle, MessageSquare, Trash2, Clock, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
  mermaidCode?: string;
  citations?: { filename: string; category: string }[];
}

interface ChatSessionMeta {
  _id: string;
  title: string;
  updatedAt: string;
  messages: { role: string }[];
}

// ── Inline renderer ───────────────────────────────────────────────────────────
function renderInline(text: string, isUser: boolean): React.ReactNode[] {
  const normalized = text.replace(/<br\s*\/?>/gi, "\n");
  const headingColor = isUser ? "text-white" : "text-slate-800 dark:text-slate-200";
  const parts = normalized.split(/(\*\*[\s\S]+?\*\*|\*[^*]+\*)/g);
  return parts
    .filter(p => p !== "")
    .map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={idx} className={`font-semibold ${headingColor}`}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
        return <em key={idx}>{part.slice(1, -1)}</em>;
      if (part.includes("\n"))
        return part.split("\n").map((seg, si, arr) => (
          <span key={`${idx}-${si}`}>{seg}{si < arr.length - 1 && <br />}</span>
        ));
      return <span key={idx}>{part}</span>;
    });
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function MarkdownContent({ content, isUser = false }: { content: string; isUser?: boolean }) {
  const textColorClass = isUser ? "text-white" : "text-slate-700 dark:text-slate-300";
  const headingColor = isUser ? "text-white" : "text-slate-800 dark:text-slate-200";

  const renderContent = () => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.includes("```mermaid") || line.startsWith("```")) { i++; continue; }

      if (line.startsWith("### ")) {
        elements.push(<h3 key={i} className={`text-base font-semibold mt-3 mb-1 ${headingColor}`}>{renderInline(line.slice(4), isUser)}</h3>);
        i++; continue;
      }
      if (line.startsWith("## ")) {
        elements.push(<h2 key={i} className={`text-lg font-semibold mt-4 mb-2 ${headingColor}`}>{renderInline(line.slice(3), isUser)}</h2>);
        i++; continue;
      }
      if (line.startsWith("# ")) {
        elements.push(<h1 key={i} className={`text-xl font-bold mt-4 mb-2 ${headingColor}`}>{renderInline(line.slice(2), isUser)}</h1>);
        i++; continue;
      }

      // Table
      if (line.match(/^\|(.+)\|$/) && !line.match(/^[\-|:\s]+$/)) {
        const headerRow = line;
        const tableRows: string[] = [line];
        i++;
        if (i < lines.length && lines[i].match(/^[\-|:\s]+$/)) i++;
        while (i < lines.length && lines[i].match(/^\|(.+)\|$/)) { tableRows.push(lines[i]); i++; }
        const headers = headerRow.split("|").filter(c => c.trim()).map((h, idx) => (
          <th key={idx} className="px-3 py-2 text-left font-semibold bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">{renderInline(h.trim(), isUser)}</th>
        ));
        const rows = tableRows.slice(1).map((row, ri) => (
          <tr key={ri} className={ri % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-700/50"}>
            {row.split("|").filter(c => c.trim()).map((cell, ci) => (
              <td key={ci} className="px-3 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">{renderInline(cell.trim(), isUser)}</td>
            ))}
          </tr>
        ));
        elements.push(
          <div key={i} className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-slate-200 dark:border-slate-600">
              <thead><tr>{headers}</tr></thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        );
        continue;
      }

      if (line.match(/^[\-|:\s]+$/)) { i++; continue; }

      if (line.match(/^[•\-\*]\s/)) {
        elements.push(<li key={i} className={`ml-5 mb-1 ${textColorClass} list-disc`}>{renderInline(line.replace(/^[•\-\*]\s/, ""), isUser)}</li>);
        i++; continue;
      }
      if (line.match(/^\d+\.\s/)) {
        elements.push(<li key={i} className={`ml-5 mb-1 ${textColorClass} list-decimal`}>{renderInline(line.replace(/^\d+\.\s/, ""), isUser)}</li>);
        i++; continue;
      }

      if (line.trim() === "") { i++; continue; }

      elements.push(<p key={i} className={`mb-2 ${textColorClass}`}>{renderInline(line, isUser)}</p>);
      i++;
    }
    return elements;
  };

  return <div className="markdown-content">{renderContent()}</div>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { status } = useSession();
  const router = useRouter();

  const [sessions, setSessions] = useState<ChatSessionMeta[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFlowchart, setShowFlowchart] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js";
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  useEffect(() => {
    if (showFlowchart && typeof window !== "undefined") {
      const m = (window as unknown as { mermaid?: { initialize: (o: unknown) => void; run: (o: { querySelector: string }) => Promise<void> } }).mermaid;
      if (m) { try { m.initialize({ startOnLoad: true }); m.run({ querySelector: ".mermaid-chart" }); } catch (e) { console.error(e); } }
    }
  }, [showFlowchart]);

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/chat/sessions?mode=chat");
      if (res.ok) { const d = await res.json(); setSessions(d.sessions || []); }
    } finally { setSessionsLoading(false); }
  }, []);

  useEffect(() => { if (status === "authenticated") fetchSessions(); }, [status, fetchSessions]);

  const createNewChat = async () => {
    const res = await fetch("/api/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "chat" }),
    });
    if (res.ok) {
      const d = await res.json();
      setSessions(prev => [d.session, ...prev]);
      setActiveSessionId(d.session._id);
      setMessages([]);
      setError("");
    }
  };

  const loadSession = async (id: string) => {
    setActiveSessionId(id);
    setError("");
    const res = await fetch(`/api/chat/sessions/${id}`);
    if (res.ok) {
      const d = await res.json();
      setMessages((d.session.messages || []).map((m: { role: "user"|"assistant"; content: string; mermaidCode?: string; citations?: {filename:string;category:string}[] }) => ({
        role: m.role,
        content: m.content,
        mermaidCode: m.mermaidCode,
        citations: m.citations || [],
      })));
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;
    setDeletingId(id);
    await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
    setSessions(prev => prev.filter(s => s._id !== id));
    if (activeSessionId === id) { setActiveSessionId(null); setMessages([]); }
    setDeletingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Auto-create session if none active
    let sessionId = activeSessionId;
    if (!sessionId) {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "chat" }),
      });
      if (!res.ok) return;
      const d = await res.json();
      sessionId = d.session._id;
      setActiveSessionId(sessionId);
      setSessions(prev => [d.session, ...prev]);
    }

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: messages }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to get response");
      } else {
        const assistantMsg: Message = { role: "assistant", content: data.message, mermaidCode: data.mermaidCode, citations: data.citations || [] };
        setMessages(prev => [...prev, assistantMsg]);

        // Persist to DB
        await fetch(`/api/chat/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMessage, assistantMessage: data.message, mermaidCode: data.mermaidCode, citations: data.citations }),
        });

        // Refresh sidebar to update title + timestamp
        fetchSessions();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const extractMermaidCode = (text: string) => {
    const m = /```mermaid\s*([\s\S]*?)```/g.exec(text);
    return m ? m[1].trim() : null;
  };

  const cleanContent = (text: string, mermaidCode: string | null | undefined) =>
    mermaidCode ? text.replace(/```mermaid[\s\S]*?```/g, "").trim() : text;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  if (status === "loading") return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0b1220]">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </main>
  );

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col bg-slate-100 dark:bg-[#0b1220]">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-white to-blue-100 dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40" />
      <div className="absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px] bg-blue-300/40 dark:bg-blue-700/20" />
      <div className="absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px] bg-indigo-300/35 dark:bg-indigo-800/25" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(o => !o)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" title="Toggle history">
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">AI Chat</h1>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex justify-center"><div className="w-10 h-10 bg-blue-400/20 rounded-full blur-[20px]" /></div>
          <Image src="/logo.png" alt="Logo" width={100} height={57} className="relative z-10 opacity-80" />
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside className={`flex-shrink-0 flex flex-col border-r border-slate-200/60 dark:border-slate-700/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 border-r-0'}`}>
          <div className="p-3 border-b border-slate-200/60 dark:border-slate-700/60">
            <Button onClick={createNewChat} className="w-full h-9 bg-slate-800 text-white dark:bg-slate-700/60 dark:text-slate-100 border border-black/10 dark:border-white/10 hover:bg-slate-700 text-sm">
              <PlusCircle className="w-4 h-4 mr-2" /> New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1.5">History</p>

            {sessionsLoading && <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>}

            {!sessionsLoading && sessions.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">No chats yet</p>
              </div>
            )}

            {sessions.map(s => (
              <div key={s._id} onClick={() => loadSession(s._id)}
                className={`group flex items-start justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${activeSessionId === s._id ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" : "hover:bg-slate-100/70 dark:hover:bg-slate-800/50 border border-transparent"}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{s.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />{formatTime(s.updatedAt)}
                  </p>
                </div>
                <button onClick={e => deleteSession(s._id, e)} disabled={deletingId === s._id}
                  className="ml-1 p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0 mt-0.5">
                  {deletingId === s._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* ── CHAT AREA ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Flowchart modal */}
          {showFlowchart && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="relative w-full max-w-4xl max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"><FileImage className="w-5 h-5" />Process Flowchart</h3>
                  <button onClick={() => setShowFlowchart(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
                <div className="p-6 overflow-auto max-h-[calc(80vh-60px)]">
                  <div className="mermaid-chart flex justify-center">{showFlowchart}</div>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
                <Bot className="w-16 h-16 text-slate-400 dark:text-slate-600" />
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Ask me anything about your documents</h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-md">I&apos;ll search through your uploaded documents and provide answers using AI.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const mermaidCode = msg.mermaidCode || extractMermaidCode(msg.content);
                const displayContent = cleanContent(msg.content, mermaidCode);
                return (
                  <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-blue-500" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-slate-800 dark:bg-slate-700 text-white" : "bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50"}`}>
                      <MarkdownContent content={displayContent} isUser={msg.role === "user"} />
                      {mermaidCode && (
                        <Button onClick={() => setShowFlowchart(mermaidCode)} className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                          <FileImage className="w-4 h-4" />View Flowchart
                        </Button>
                      )}
                      {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                          {msg.citations.map((c, ci) => (
                            <span key={ci} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                              <FileText className="w-3 h-3 flex-shrink-0" />
                              {c.filename}
                              {c.category && <span className="text-slate-400 dark:text-slate-500">· {c.category}</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>                    {msg.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600/20 dark:bg-slate-600/30 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-500" />
                </div>
                <div className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg px-4 py-2 text-sm">{error}</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)}
                placeholder="Ask a question about your documents..."
                disabled={loading}
                className="flex-1 h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50" />
              <Button type="submit" disabled={loading || !input.trim()}
                className="h-12 px-6 bg-slate-800 text-white dark:bg-slate-700/60 dark:text-slate-100 border border-black/10 dark:border-white/10 hover:bg-slate-700 disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
