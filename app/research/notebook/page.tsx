"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, Plus, Loader2, Trash2,
  FileText, MessageSquare, Clock, Sparkles, Search,
} from "lucide-react";
import Image from "next/image";

interface NotebookMeta {
  _id: string;
  title: string;
  description: string;
  docs: { docId: string; filename: string }[];
  messages: { role: string }[];
  updatedAt: string;
  createdAt: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)   return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const COLORS = [
  "from-indigo-500 to-violet-500",
  "from-cyan-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-green-500 to-emerald-500",
  "from-blue-500 to-indigo-500",
];

export default function NotebookHubPage() {
  const { status } = useSession();
  const router = useRouter();

  const [notebooks, setNotebooks] = useState<NotebookMeta[]>([]);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [showNew, setShowNew]     = useState(false);
  const [newTitle, setNewTitle]   = useState("");
  const [newDesc, setNewDesc]     = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchNotebooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/research/notebook/sessions");
      if (res.ok) {
        const data = await res.json();
        setNotebooks(data.notebooks || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchNotebooks();
  }, [status, fetchNotebooks]);

  const createNotebook = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/research/notebook/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() || "Untitled Notebook", description: newDesc.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/research/notebook/${data.notebook._id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteNotebook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this notebook? This cannot be undone.")) return;
    setDeletingId(id);
    await fetch(`/api/research/notebook/sessions/${id}`, { method: "DELETE" });
    setNotebooks(prev => prev.filter(n => n._id !== id));
    setDeletingId(null);
  };

  const filtered = notebooks.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.description.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-900">
      {/* Backgrounds */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[140px] bg-indigo-200/50 pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full blur-[120px] bg-violet-200/40 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/60 backdrop-blur-sm">
        <button onClick={() => router.push("/research")} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Research Hub
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <span className="text-base font-semibold text-slate-800">Notebook LLM</span>
        </div>
        <Image src="/logo.png" alt="Agento" width={80} height={48} className="opacity-80" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">

        {/* Hero row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Your Notebooks</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Notebook LLM</h1>
            <p className="text-sm text-slate-500 mt-1">Upload documents, ask questions, get cited answers. Each notebook keeps its own sources and chat history.</p>
          </div>

          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all hover:-translate-y-0.5 shadow-md shadow-indigo-200 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> New Notebook
          </button>
        </div>

        {/* Search */}
        {notebooks.length > 3 && (
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notebooks..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && notebooks.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-indigo-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-700">No notebooks yet</p>
              <p className="text-sm text-slate-400 mt-1 max-w-xs">Create your first notebook to start uploading documents and asking questions.</p>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> Create Notebook
            </button>
          </div>
        )}

        {/* Notebook grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((nb, idx) => {
              const msgCount = nb.messages.filter(m => m.role === "user").length;
              const color = COLORS[idx % COLORS.length];
              return (
                <div
                  key={nb._id}
                  onClick={() => router.push(`/research/notebook/${nb._id}`)}
                  className="group relative bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  {/* Color band */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${color}`} />

                  <div className="p-5">
                    {/* Icon + delete */}
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <button
                        onClick={e => deleteNotebook(nb._id, e)}
                        disabled={deletingId === nb._id}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        {deletingId === nb._id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">{nb.title}</h3>
                    {nb.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{nb.description}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <FileText className="w-3 h-3" />
                        {nb.docs.length} doc{nb.docs.length !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <MessageSquare className="w-3 h-3" />
                        {msgCount} message{msgCount !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
                        <Clock className="w-3 h-3" />
                        {timeAgo(nb.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Notebook Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-500" /> New Notebook
            </h2>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Title</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Q3 Research Papers"
                  autoFocus
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) createNotebook(); }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What is this notebook about?"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowNew(false); setNewTitle(""); setNewDesc(""); }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createNotebook}
                disabled={creating}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold disabled:opacity-60 transition-all hover:-translate-y-0.5 shadow-sm"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
