"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Code2, Upload, Send, Bot, User, Loader2,
  Folder, FileCode, Trash2, Sparkles, X, ChevronRight,
  Copy, Check,
} from "lucide-react";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FileNode {
  name: string;
  path: string;
  size: number;
  content?: string;
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700 my-3">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
        <span className="text-[10px] text-slate-400 font-mono">{language || "code"}</span>
        <button onClick={copy} className="p-1 rounded text-slate-400 hover:text-white transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="text-xs text-slate-200 bg-slate-900 px-4 py-3 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderMessage(content: string, isUser: boolean) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const lines = part.slice(3, -3).trim().split("\n");
      const lang = lines[0].trim();
      const code = lines.slice(1).join("\n");
      return <CodeBlock key={i} code={code} language={lang} />;
    }
    return (
      <div key={i}>
        {part.split("\n").map((line, li) => {
          if (line.startsWith("### ")) return <h3 key={li} className="text-sm font-semibold text-slate-800 mt-3 mb-1">{line.slice(4)}</h3>;
          if (line.startsWith("## ")) return <h2 key={li} className="text-base font-semibold text-slate-800 mt-3 mb-1">{line.slice(3)}</h2>;
          if (line.match(/^[•\-\*]\s/)) return <li key={li} className={`ml-4 mb-0.5 text-sm list-disc ${isUser ? "text-slate-200" : "text-slate-700"}`}>{line.replace(/^[•\-\*]\s/, "")}</li>;
          if (line.trim() === "") return <br key={li} />;
          return <p key={li} className={`text-sm mb-1.5 ${isUser ? "text-white" : "text-slate-700"}`}>{line}</p>;
        })}
      </div>
    );
  });
}

export default function CodingAssistantPage() {
  const { status } = useSession();
  const router = useRouter();

  const [files, setFiles] = useState<FileNode[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId] = useState(() => `code-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleFolderUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setUploading(true);
    setError("");

    const codeExts = ["ts", "tsx", "js", "jsx", "py", "go", "rs", "java", "cpp", "c", "cs", "php", "rb", "swift", "kt", "md", "json", "yaml", "yml", "toml", "css", "html", "sql"];
    const validFiles: File[] = [];

    for (const file of Array.from(uploadedFiles)) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!codeExts.includes(ext)) continue;
      if (file.size > 100 * 1024) continue; // skip files > 100KB
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      setError("No supported code files found. Supported: .ts, .tsx, .js, .py, .go, .java, etc.");
      setUploading(false);
      return;
    }

    const fd = new FormData();
    fd.append("sessionId", sessionId);
    validFiles.forEach((f) => fd.append("files", f, f.webkitRelativePath || f.name));

    try {
      const res = await fetch("/api/research/coding/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setFiles(data.files || []);
      } else {
        setError(data.message || "Upload failed");
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [sessionId]);

  const removeFile = async (path: string) => {
    try {
      await fetch(`/api/research/coding/upload?path=${encodeURIComponent(path)}&sessionId=${sessionId}`, { method: "DELETE" });
    } catch { /* ignore */ }
    setFiles((prev) => prev.filter((f) => f.path !== path));
    if (selectedFile?.path === path) setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    if (files.length === 0) { setError("Upload your codebase first."); return; }

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/research/coding/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: messages.slice(-8), sessionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      } else {
        setError(data.message || "Failed to get response");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    const colors: Record<string, string> = {
      ts: "text-blue-500", tsx: "text-blue-400", js: "text-yellow-500",
      jsx: "text-yellow-400", py: "text-green-500", go: "text-cyan-500",
      rs: "text-orange-600", java: "text-red-500", css: "text-purple-500",
      html: "text-orange-400",
    };
    return colors[ext || ""] || "text-slate-400";
  };

  const SUGGESTIONS = [
    "Explain the overall architecture",
    "Find potential bugs or issues",
    "How can I improve performance?",
    "Refactor this to use better patterns",
    "What does this function do?",
    "Add error handling to the codebase",
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col bg-[#0d1117]">
      {/* Dark code editor background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117] via-[#0d1117] to-[#161b22] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[400px] h-[400px] rounded-full blur-[120px] bg-cyan-500/10 pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[300px] h-[300px] rounded-full blur-[100px] bg-blue-500/10 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/research")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all"
            title="Toggle sidebar"
          >
            <Folder className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-cyan-400" />
          <h1 className="text-base font-semibold text-slate-200">AI Coding Assistant</h1>
        </div>
        <Image src="/logo.png" alt="Logo" width={80} height={48} className="opacity-60" />
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* Sidebar: file explorer */}
        <aside className={`flex-shrink-0 flex flex-col border-r border-white/10 bg-[#161b22] overflow-y-auto transition-all duration-300 ${sidebarOpen ? "w-60" : "w-0 border-r-0 overflow-hidden"}`}>
          {/* Upload area */}
          <div className="p-3 border-b border-white/10">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">EXPLORER</p>
            <label htmlFor="code-folder" className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-slate-700 hover:border-cyan-700 hover:bg-cyan-950/20 cursor-pointer transition-all group">
              {uploading ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              )}
              <span className="text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
                {uploading ? "Uploading..." : "Upload Folder"}
              </span>
              <input
                id="code-folder"
                type="file"
                /* @ts-expect-error webkitdirectory is valid HTML attribute */
                webkitdirectory=""
                multiple
                className="hidden"
                onChange={handleFolderUpload}
                disabled={uploading}
              />
            </label>
            {error && <p className="mt-2 text-[10px] text-red-400">{error}</p>}
          </div>

          {/* File tree */}
          <div className="flex-1 p-2 space-y-0.5">
            {files.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                <p className="text-xs text-slate-600">No files yet</p>
                <p className="text-[10px] text-slate-700 mt-1">Upload a folder to start</p>
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.path}
                  className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${selectedFile?.path === file.path ? "bg-cyan-950/40 border border-cyan-800/50" : "hover:bg-white/5"}`}
                  onClick={() => setSelectedFile(selectedFile?.path === file.path ? null : file)}
                >
                  <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${getFileIcon(file.name)}`} />
                  <span className="text-xs text-slate-400 truncate flex-1 group-hover:text-slate-200 transition-colors">{file.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(file.path); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-red-400 transition-all rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {files.length > 0 && (
            <div className="p-3 border-t border-white/10">
              <p className="text-[10px] text-slate-600">{files.length} files · {(files.reduce((s, f) => s + f.size, 0) / 1024).toFixed(1)} KB total</p>
            </div>
          )}
        </aside>

        {/* File viewer + chat split or just chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* File preview */}
          {selectedFile && (
            <div className="flex-shrink-0 h-48 border-b border-white/10 bg-[#161b22] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-400 font-mono">{selectedFile.path}</span>
                </div>
                <button onClick={() => setSelectedFile(null)} className="p-1 rounded text-slate-500 hover:text-slate-200 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="overflow-auto h-[calc(100%-33px)] p-4">
                <pre className="text-[11px] text-slate-300 font-mono leading-relaxed">
                  {selectedFile.content || "(Content not available — ask the AI about this file)"}
                </pre>
              </div>
            </div>
          )}

          {/* Chat */}
          <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Code2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-200">AI Coding Assistant</h2>
                <p className="text-slate-500 text-sm max-w-md">
                  Upload your codebase folder on the left, then ask anything — architecture questions, bug hunting, refactoring, explanations, and more.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 max-w-md">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:border-cyan-800/60 hover:text-cyan-400 hover:bg-cyan-950/20 transition-all text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {files.length === 0 && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-950/30 border border-cyan-900/50 text-cyan-400 text-xs">
                    <Sparkles className="w-3.5 h-3.5" /> Upload a folder to enable code analysis
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-cyan-400" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-slate-700 text-white" : "bg-[#161b22] border border-white/10"}`}>
                    {renderMessage(msg.content, msg.role === "user")}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="bg-[#161b22] border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-red-950/40 text-red-400 rounded-lg px-4 py-2 text-xs border border-red-900/50">{error}</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10 bg-black/20 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={files.length === 0 ? "Upload a codebase first..." : "Ask about your code — bugs, architecture, refactoring..."}
                disabled={loading || files.length === 0}
                className="flex-1 h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 disabled:opacity-40 transition-all"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || files.length === 0}
                className="h-11 w-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white hover:from-cyan-500 hover:to-teal-500 disabled:opacity-40 transition-all shadow-md shadow-cyan-900/50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
