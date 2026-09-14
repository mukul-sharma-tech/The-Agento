"use client";

import { useState, useEffect, useRef, useCallback, useReducer } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft, FolderOpen, FileCode2, Bot, User, Send, Loader2,
  X, ChevronRight, ChevronDown, Save, Copy, Check,
  Search, GitBranch, Settings, LayoutPanelLeft,
  TriangleAlert, CircleCheck, Dot, Plus, MessageSquare,
  Sparkles, Code2,
} from "lucide-react";
import Image from "next/image";

// ─── Monaco - loaded only on client (no SSR) ─────────────────────────────────
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ─── File System Access API types ─────────────────────────────────────────────
declare global {
  interface Window {
    showDirectoryPicker(opts?: { mode?: "read" | "readwrite" }): Promise<FileSystemDirectoryHandle>;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface TreeNode {
  name: string;
  path: string;
  kind: "file" | "directory";
  handle: FileSystemFileHandle | FileSystemDirectoryHandle;
  children?: TreeNode[];
  expanded?: boolean;
  language?: string;
}

interface OpenTab {
  path: string;
  name: string;
  content: string;
  savedContent: string; // for dirty tracking
  handle: FileSystemFileHandle;
  language: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Language detection ───────────────────────────────────────────────────────
const EXT_LANG: Record<string, string> = {
  ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
  py: "python", go: "go", rs: "rust", java: "java", cpp: "cpp", c: "c",
  cs: "csharp", php: "php", rb: "ruby", swift: "swift", kt: "kotlin",
  md: "markdown", json: "json", yaml: "yaml", yml: "yaml", toml: "toml",
  css: "css", scss: "scss", html: "html", xml: "xml", sql: "sql",
  sh: "shell", bash: "shell", zsh: "shell", env: "plaintext",
  txt: "plaintext", gitignore: "plaintext", dockerfile: "dockerfile",
};

const EXT_COLOR: Record<string, string> = {
  ts: "#3b82f6", tsx: "#60a5fa", js: "#eab308", jsx: "#fcd34d",
  py: "#22c55e", go: "#06b6d4", rs: "#f97316", java: "#ef4444",
  cpp: "#a855f7", cs: "#6366f1", css: "#e879f9", html: "#f97316",
  json: "#94a3b8", md: "#64748b",
};

function getLang(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_LANG[ext] ?? "plaintext";
}
function getColor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_COLOR[ext] ?? "#94a3b8";
}

// ─── Skipped paths ────────────────────────────────────────────────────────────
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", ".turbo", "__pycache__", ".venv", "venv"]);
const CODE_EXTS = new Set(Object.keys(EXT_LANG));

// ─── Recursive directory reader ───────────────────────────────────────────────
async function readDir(
  handle: FileSystemDirectoryHandle,
  parentPath: string,
  depth = 0
): Promise<TreeNode[]> {
  if (depth > 6) return [];
  const nodes: TreeNode[] = [];
  for await (const [name, entry] of handle as unknown as AsyncIterable<[string, FileSystemHandle]>) {
    if (name.startsWith(".") && name !== ".env" && name !== ".gitignore") continue;
    const path = parentPath ? `${parentPath}/${name}` : name;
    if (entry.kind === "directory") {
      if (SKIP_DIRS.has(name)) continue;
      const dirHandle = entry as FileSystemDirectoryHandle;
      nodes.push({
        name, path, kind: "directory", handle: dirHandle,
        children: undefined, expanded: false,
      });
    } else {
      const ext = name.split(".").pop()?.toLowerCase() ?? "";
      if (!CODE_EXTS.has(ext) && !["gitignore", "dockerfile", "env"].includes(name.toLowerCase())) continue;
      nodes.push({
        name, path, kind: "file",
        handle: entry as FileSystemFileHandle,
        language: getLang(name),
      });
    }
  }
  return nodes.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// ─── Inline chat message renderer ────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold text-slate-200">{p.slice(2,-2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i} className="italic text-slate-300">{p.slice(1,-1)}</em>;
    return <span key={i}>{p}</span>;
  });
}

function ChatContent({ content, isUser }: { content: string; isUser: boolean }) {
  const tc = isUser ? "text-white" : "text-slate-300";
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="leading-relaxed text-sm">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          const lang = lines[0].trim();
          const code = lines.slice(1).join("\n");
          return (
            <div key={i} className="my-2 rounded-lg overflow-hidden border border-slate-700">
              <div className="flex items-center justify-between px-3 py-1 bg-slate-800 border-b border-slate-700">
                <span className="text-[10px] text-slate-400 font-mono">{lang || "code"}</span>
                <CopyBtn text={code} />
              </div>
              <pre className="text-xs text-slate-300 bg-[#0d1117] px-3 py-2 overflow-x-auto font-mono">{code}</pre>
            </div>
          );
        }
        return (
          <div key={i}>
            {part.split("\n").map((line, li) => {
              if (line.startsWith("### ")) return <h3 key={li} className="text-xs font-semibold text-slate-200 mt-2 mb-0.5">{line.slice(4)}</h3>;
              if (line.startsWith("## "))  return <h2 key={li} className="text-sm font-semibold text-slate-200 mt-3 mb-1">{line.slice(3)}</h2>;
              if (line.match(/^[•\-\*]\s/)) return <li key={li} className={`ml-4 mb-0.5 list-disc text-xs ${tc}`}>{renderInline(line.replace(/^[•\-\*]\s/,""))}</li>;
              if (line.trim() === "") return <div key={li} className="h-1" />;
              return <p key={li} className={`mb-1 text-xs ${tc}`}>{renderInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-slate-500 hover:text-slate-300 transition-colors p-0.5">
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ─── Tree node component ──────────────────────────────────────────────────────
function TreeItem({
  node, depth, activeTab, onFileClick, onToggle,
}: {
  node: TreeNode;
  depth: number;
  activeTab: string | null;
  onFileClick: (node: TreeNode) => void;
  onToggle: (path: string) => void;
}) {
  const isActive = node.kind === "file" && activeTab === node.path;
  const indent = depth * 12;

  if (node.kind === "directory") {
    return (
      <div>
        <div
          onClick={() => onToggle(node.path)}
          className="flex items-center gap-1.5 py-0.5 px-2 cursor-pointer hover:bg-white/5 rounded transition-colors text-slate-400 hover:text-slate-200 select-none"
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          {node.expanded ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
          <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-yellow-500/80" />
          <span className="text-[12px] truncate">{node.name}</span>
        </div>
        {node.expanded && node.children && (
          <div>
            {node.children.map(child => (
              <TreeItem key={child.path} node={child} depth={depth + 1}
                activeTab={activeTab} onFileClick={onFileClick} onToggle={onToggle} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onFileClick(node)}
      className={`flex items-center gap-1.5 py-0.5 px-2 cursor-pointer rounded transition-colors select-none ${
        isActive ? "bg-slate-700/70 text-slate-100" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      }`}
      style={{ paddingLeft: `${8 + indent + 16}px` }}
    >
      <FileCode2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: getColor(node.name) }} />
      <span className="text-[12px] truncate">{node.name}</span>
    </div>
  );
}

// ─── Tree state reducer ───────────────────────────────────────────────────────
type TreeAction =
  | { type: "SET_ROOT"; nodes: TreeNode[] }
  | { type: "TOGGLE"; path: string; children?: TreeNode[] }
  | { type: "RESET" };

function toggleInTree(nodes: TreeNode[], path: string, children?: TreeNode[]): TreeNode[] {
  return nodes.map(n => {
    if (n.path === path && n.kind === "directory") {
      return { ...n, expanded: !n.expanded, children: children ?? n.children };
    }
    if (n.children) return { ...n, children: toggleInTree(n.children, path, children) };
    return n;
  });
}

function treeReducer(state: TreeNode[], action: TreeAction): TreeNode[] {
  switch (action.type) {
    case "SET_ROOT": return action.nodes;
    case "TOGGLE":   return toggleInTree(state, action.path, action.children);
    case "RESET":    return [];
    default:         return state;
  }
}

// ─── Activity icons ───────────────────────────────────────────────────────────
type Panel = "explorer" | "search" | "git" | "ai";

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function CodingAssistantPage() {
  const { status } = useSession();
  const router = useRouter();

  // Layout
  const [activePanel, setActivePanel] = useState<Panel>("explorer");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);

  // File system
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [rootName, setRootName] = useState("");
  const [tree, dispatchTree] = useReducer(treeReducer, []);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ path: string; line: number; text: string }[]>([]);
  const [searching, setSearching] = useState(false);

  // AI chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  // Status bar
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, chatLoading]);

  // ── Open folder ─────────────────────────────────────────────────────────────
  const openFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      setRootHandle(dirHandle);
      setRootName(dirHandle.name);
      dispatchTree({ type: "RESET" });
      setOpenTabs([]);
      setActiveTabPath(null);
      const nodes = await readDir(dirHandle, "");
      dispatchTree({ type: "SET_ROOT", nodes });
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.error(e);
    }
  };

  // ── Toggle directory in tree ─────────────────────────────────────────────────
  const handleToggle = useCallback(async (path: string) => {
    // Find the node
    const findNode = (nodes: TreeNode[], p: string): TreeNode | null => {
      for (const n of nodes) {
        if (n.path === p) return n;
        if (n.children) { const found = findNode(n.children, p); if (found) return found; }
      }
      return null;
    };

    const node = findNode(tree, path);
    if (!node || node.kind !== "directory") return;

    if (!node.expanded && !node.children) {
      // Load children lazily
      const children = await readDir(node.handle as FileSystemDirectoryHandle, path);
      dispatchTree({ type: "TOGGLE", path, children });
    } else {
      dispatchTree({ type: "TOGGLE", path });
    }
  }, [tree]);

  // ── Open file in editor ──────────────────────────────────────────────────────
  const openFile = useCallback(async (node: TreeNode) => {
    if (node.kind !== "file") return;
    const existing = openTabs.find(t => t.path === node.path);
    if (existing) { setActiveTabPath(node.path); return; }

    try {
      const fh = node.handle as FileSystemFileHandle;
      const file = await fh.getFile();
      const content = await file.text();
      const lang = getLang(node.name);
      setOpenTabs(prev => [...prev, { path: node.path, name: node.name, content, savedContent: content, handle: fh, language: lang }]);
      setActiveTabPath(node.path);
    } catch (e) { console.error("Cannot read file", e); }
  }, [openTabs]);

  // ── Close tab ────────────────────────────────────────────────────────────────
  const closeTab = useCallback((path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tab = openTabs.find(t => t.path === path);
    if (tab && tab.content !== tab.savedContent) {
      if (!confirm(`${tab.name} has unsaved changes. Close anyway?`)) return;
    }
    const remaining = openTabs.filter(t => t.path !== path);
    setOpenTabs(remaining);
    if (activeTabPath === path) {
      setActiveTabPath(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
  }, [openTabs, activeTabPath]);

  // ── Editor content change ────────────────────────────────────────────────────
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value === undefined || !activeTabPath) return;
    setOpenTabs(prev => prev.map(t => t.path === activeTabPath ? { ...t, content: value } : t));
  }, [activeTabPath]);

  // ── Save file (Ctrl+S / Cmd+S) ───────────────────────────────────────────────
  const saveFile = useCallback(async () => {
    const tab = openTabs.find(t => t.path === activeTabPath);
    if (!tab) return;
    setSaving(true);
    try {
      const writable = await tab.handle.createWritable();
      await writable.write(tab.content);
      await writable.close();
      setOpenTabs(prev => prev.map(t => t.path === tab.path ? { ...t, savedContent: t.content } : t));
    } catch (e) { console.error("Save failed", e); }
    finally { setSaving(false); }
  }, [openTabs, activeTabPath]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveFile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveFile]);

  // ── Global code search ───────────────────────────────────────────────────────
  const runSearch = useCallback(async () => {
    if (!searchQuery.trim() || !rootHandle) return;
    setSearching(true);
    setSearchResults([]);
    const results: { path: string; line: number; text: string }[] = [];

    const searchDir = async (dirHandle: FileSystemDirectoryHandle, base: string) => {
      for await (const [name, entry] of dirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>) {
        if (SKIP_DIRS.has(name) || name.startsWith(".")) continue;
        const p = base ? `${base}/${name}` : name;
        if (entry.kind === "file") {
          const ext = name.split(".").pop()?.toLowerCase() ?? "";
          if (!CODE_EXTS.has(ext)) continue;
          try {
            const file = await (entry as FileSystemFileHandle).getFile();
            const text = await file.text();
            text.split("\n").forEach((line, i) => {
              if (line.toLowerCase().includes(searchQuery.toLowerCase())) {
                results.push({ path: p, line: i + 1, text: line.trim().slice(0, 80) });
              }
            });
          } catch { /* skip */ }
        } else if (entry.kind === "directory") {
          await searchDir(entry as FileSystemDirectoryHandle, p);
        }
      }
    };

    await searchDir(rootHandle, "");
    setSearchResults(results.slice(0, 100));
    setSearching(false);
  }, [searchQuery, rootHandle]);

  // ── AI chat ──────────────────────────────────────────────────────────────────
  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);
    setChatError("");

    // Build context:
    // 1. Active tab (full content)
    // 2. Other open tabs (truncated)
    // 3. If no tabs open but a folder is loaded, send file tree overview
    const activeTab = openTabs.find(t => t.path === activeTabPath);

    const contextFiles = openTabs.slice(0, 5).map(t =>
      `// File: ${t.path}\n${t.content.slice(0, 2000)}`
    ).join("\n\n---\n\n");

    // Build a file tree string from the in-memory tree for folder-level questions
    const buildTreeSummary = (nodes: TreeNode[], depth = 0): string => {
      const indent = "  ".repeat(depth);
      return nodes
        .filter(n => depth < 3)
        .map(n => {
          if (n.kind === "directory") {
            const kids = n.children ? buildTreeSummary(n.children, depth + 1) : "";
            return `${indent}📁 ${n.name}/${kids ? "\n" + kids : ""}`;
          }
          return `${indent}📄 ${n.name}`;
        })
        .join("\n");
    };

    const folderSummary = rootHandle && tree.length > 0
      ? `FOLDER: ${rootName}\n${buildTreeSummary(tree)}`
      : "";

    try {
      const res = await fetch("/api/research/coding/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-6),
          activeFile: activeTab ? { path: activeTab.path, content: activeTab.content } : null,
          contextFiles: contextFiles || undefined,
          folderSummary: folderSummary || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      else setChatError(data.message || "Failed");
    } catch {
      setChatError("Something went wrong");
    } finally {
      setChatLoading(false);
    }
  };

  // ── Active tab data ──────────────────────────────────────────────────────────
  const activeTab = openTabs.find(t => t.path === activeTabPath);
  const isDirty = activeTab && activeTab.content !== activeTab.savedContent;

  // Breadcrumb segments
  const breadcrumbs = activeTab?.path.split("/") ?? [];

  if (status === "loading") return (
    <div className="h-screen flex items-center justify-center bg-[#0B0F19]">
      <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0B0F19] text-[#F8FAFC] select-none"
      style={{ fontFamily: "'Geist', 'Inter', system-ui, sans-serif" }}>

      {/* ════════ MAIN ROW (activity + panels + editor + AI) ════════ */}
      <div className="flex flex-1 overflow-hidden min-h-0">

      {/* ════════════════ ACTIVITY BAR ════════════════ */}
      <aside className="w-12 flex-shrink-0 border-r border-slate-800 bg-[#0B0F19] flex flex-col items-center py-3 gap-1">
        {/* Back */}
        <button onClick={() => router.push("/research")}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all mb-2" title="Back to Research">
          <ArrowLeft className="w-4 h-4" />
        </button>

        {([ ["explorer", <LayoutPanelLeft className="w-5 h-5" />, "Explorer"],
            ["search",   <Search className="w-5 h-5" />,           "Search"],
            ["git",      <GitBranch className="w-5 h-5" />,         "Source Control"],
            ["ai",       <Sparkles className="w-5 h-5" />,          "AI Assistant"],
        ] as [Panel, React.ReactNode, string][]).map(([id, icon, title]) => (
          <button key={id}
            onClick={() => { setActivePanel(id); if (id === "ai") setAiOpen(true); else setSidebarOpen(true); }}
            title={title}
            className={`p-2 rounded-lg transition-all ${
              activePanel === id && (id === "ai" ? aiOpen : sidebarOpen)
                ? "text-slate-100 bg-slate-700 border-l-2 border-indigo-500 rounded-l-none"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
            }`}
          >
            {icon}
          </button>
        ))}

        <div className="flex-1" />
        <button className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all" title="Settings">
          <Settings className="w-4 h-4" />
        </button>
        <div className="relative">
          <div className="absolute inset-0 flex justify-center items-center">
            <div className="w-8 h-8 bg-indigo-500/10 rounded-full blur-[10px]" />
          </div>
          <Image src="/logo.png" alt="Agento" width={32} height={20} className="relative opacity-60" />
        </div>
      </aside>

      {/* ════════════════ LEFT PANEL (explorer / search / git) ════════════════ */}
      {sidebarOpen && activePanel !== "ai" && (
        <section className="w-64 flex-shrink-0 border-r border-slate-800 bg-[#111827] flex flex-col overflow-hidden">

          {/* ── Explorer ── */}
          {activePanel === "explorer" && (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                <span className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Explorer</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded text-slate-600 hover:text-slate-300 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {!rootHandle ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
                  <FolderOpen className="w-10 h-10 text-slate-700" />
                  <p className="text-[11px] text-slate-500 text-center leading-relaxed">Open a local folder to start editing your code directly on disk</p>
                  <button onClick={openFolder}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all">
                    <FolderOpen className="w-3.5 h-3.5" /> Open Folder
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/50">
                    <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider truncate">{rootName}</span>
                    <button onClick={openFolder} title="Open different folder"
                      className="p-1 rounded text-slate-600 hover:text-slate-300 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto py-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:transparent">
                    {tree.map(node => (
                      <TreeItem key={node.path} node={node} depth={0}
                        activeTab={activeTabPath} onFileClick={openFile} onToggle={handleToggle} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Search ── */}
          {activePanel === "search" && (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                <span className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Search</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded text-slate-600 hover:text-slate-300 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-3">
                <form onSubmit={e => { e.preventDefault(); runSearch(); }} className="flex gap-1.5">
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search in files..."
                    className="flex-1 h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button type="submit" disabled={searching || !rootHandle}
                    className="px-2 h-7 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40">
                    {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  </button>
                </form>
                {!rootHandle && <p className="text-[10px] text-slate-600 mt-2">Open a folder first</p>}
              </div>
              <div className="flex-1 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <button key={i} onClick={async () => {
                    // Find the node and open it
                    const findAndOpen = async (nodes: TreeNode[], path: string): Promise<boolean> => {
                      for (const n of nodes) {
                        if (n.path === path && n.kind === "file") { await openFile(n); return true; }
                        if (n.children) { if (await findAndOpen(n.children, path)) return true; }
                      }
                      return false;
                    };
                    await findAndOpen(tree, r.path);
                  }}
                    className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition-all border-b border-slate-800/50">
                    <p className="text-[11px] text-slate-400 truncate">{r.path} <span className="text-slate-600">:{r.line}</span></p>
                    <p className="text-[11px] text-slate-300 font-mono truncate mt-0.5">{r.text}</p>
                  </button>
                ))}
                {searchResults.length === 0 && searchQuery && !searching && (
                  <p className="text-[11px] text-slate-600 px-3 py-4 text-center">No results</p>
                )}
              </div>
            </>
          )}

          {/* ── Git ── */}
          {activePanel === "git" && (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                <span className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Source Control</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded text-slate-600 hover:text-slate-300 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
                <GitBranch className="w-8 h-8 text-slate-700" />
                <p className="text-[11px] text-slate-500">Git integration is available via your local terminal (not accessible from browser). Use your system terminal for git commands.</p>
              </div>
            </>
          )}
        </section>
      )}

      {/* ════════════════ MAIN EDITOR ════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Tab Bar ── */}
        <header className="flex-shrink-0 h-9 flex items-stretch border-b border-slate-800 bg-[#111827] overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {openTabs.length === 0 ? (
            <div className="flex items-center px-4 text-[11px] text-slate-600">
              {rootHandle ? "Select a file from the explorer" : "Open a folder to start"}
            </div>
          ) : (
            openTabs.map(tab => {
              const dirty = tab.content !== tab.savedContent;
              const active = tab.path === activeTabPath;
              return (
                <div key={tab.path}
                  onClick={() => setActiveTabPath(tab.path)}
                  className={`group flex items-center gap-1.5 px-3 border-r border-slate-800 cursor-pointer whitespace-nowrap flex-shrink-0 transition-all relative ${
                    active ? "bg-[#0B0F19] text-slate-100" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  {active && <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                  <FileCode2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: getColor(tab.name) }} />
                  <span className="text-[12px]">{tab.name}</span>
                  {dirty && <Dot className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                  <button onClick={e => closeTab(tab.path, e)}
                    className={`p-0.5 rounded transition-colors flex-shrink-0 ${
                      active ? "text-slate-500 hover:text-slate-100 hover:bg-slate-700" : "text-transparent group-hover:text-slate-500 hover:!text-slate-300"
                    }`}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </header>

        {/* ── Breadcrumbs ── */}
        {activeTab && (
          <div className="flex-shrink-0 flex items-center gap-1 px-4 py-1 border-b border-slate-800/50 bg-[#0B0F19] text-[11px] text-slate-500">
            {breadcrumbs.map((seg, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                <span className={i === breadcrumbs.length - 1 ? "text-slate-300" : ""}>{seg}</span>
              </span>
            ))}
          </div>
        )}

        {/* ── Editor / Welcome ── */}
        <div className="flex-1 overflow-hidden">
          {!activeTab ? (
            <div className="h-full flex flex-col items-center justify-center gap-5 text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Code2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-300 mb-1">AI Coding Assistant</h2>
                <p className="text-slate-600 text-sm max-w-sm">
                  {rootHandle
                    ? "Select a file from the explorer on the left to start editing."
                    : "Click the Explorer icon and open a local folder. Files are read and written directly - no upload needed."}
                </p>
              </div>
              {!rootHandle && (
                <button onClick={openFolder}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg">
                  <FolderOpen className="w-4 h-4" /> Open Local Folder
                </button>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2 max-w-md">
                {["Explain the architecture", "Find all TODO comments", "Refactor this function", "Add TypeScript types"].map(s => (
                  <button key={s} onClick={() => { setChatInput(s); setAiOpen(true); setActivePanel("ai"); }}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:border-indigo-700 hover:text-indigo-400 transition-all text-left">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <MonacoEditor
              height="100%"
              language={activeTab.language}
              value={activeTab.content}
              theme="vs-dark"
              onChange={handleEditorChange}
              onMount={(editor) => {
                editor.onDidChangeCursorPosition(e => {
                  setCursorPos({ line: e.position.lineNumber, col: e.position.column });
                });
              }}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                lineNumbers: "on",
                minimap: { enabled: true, scale: 0.7 },
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                renderLineHighlight: "all",
                smoothScrolling: true,
                cursorSmoothCaretAnimation: "on",
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true, indentation: true },
                padding: { top: 8, bottom: 8 },
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              }}
            />
          )}
        </div>
      </main>

      {/* ════════════════ AI PANEL ════════════════ */}
      {aiOpen && (
        <aside className="w-80 flex-shrink-0 border-l border-slate-800 bg-[#111827] flex flex-col overflow-hidden">

          {/* AI header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200">AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={() => setMessages([])}
                  className="p-1.5 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-700 transition-all text-[10px]">
                  Clear
                </button>
              )}
              <button onClick={() => setAiOpen(false)}
                className="p-1.5 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-700 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Context bar */}
          {activeTab && (
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border-b border-slate-800">
              <FileCode2 className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-400 truncate">{activeTab.path}</span>
            </div>
          )}

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-700">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                <MessageSquare className="w-10 h-10 text-slate-700" />
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-[180px]">
                  Ask me anything about your code - I can see all your open files
                </p>
                <div className="space-y-1.5 w-full">
                  {["What does this file do?", "Find potential bugs", "Suggest improvements", "Write unit tests"].map(s => (
                    <button key={s} onClick={() => setChatInput(s)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-400 hover:border-indigo-600/50 hover:text-indigo-400 transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg bg-indigo-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                )}
                <div className={`max-w-[90%] rounded-xl px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-indigo-600/20 border border-indigo-500/30 text-slate-200"
                    : "bg-slate-800/80 border border-slate-700"
                }`}>
                  <ChatContent content={msg.content} isUser={msg.role === "user"} />
                </div>
                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2">
                  <div className="flex gap-1">{[0,150,300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}</div>
                </div>
              </div>
            )}
            {chatError && <p className="text-[10px] text-red-400 text-center">{chatError}</p>}
          </div>

          {/* Chat input */}
          <div className="flex-shrink-0 p-3 border-t border-slate-800">
            <form onSubmit={sendChat} className="flex gap-1.5">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about your code..."
                disabled={chatLoading}
                className="flex-1 h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-40 transition-all"
              />
              <button type="submit" disabled={chatLoading || !chatInput.trim()}
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all">
                {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>
        </aside>
      )}

      {/* ════════════════ STATUS BAR ════════════════ */}
      </div>{/* end main row */}
      <div className="flex-shrink-0 h-[22px] bg-indigo-600 flex items-center justify-between px-3 z-50 text-white select-none">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" /> {rootName || "No folder open"}
          </span>
          {saving && <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>}
          {isDirty && <span className="text-amber-300">● Unsaved</span>}
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          {activeTab && (
            <>
              <span className="text-indigo-200">{activeTab.language}</span>
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            </>
          )}
          <span className="flex items-center gap-1">
            <CircleCheck className="w-3 h-3 text-green-300" /> 0
            <TriangleAlert className="w-3 h-3 text-amber-300 ml-1" /> 0
          </span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
