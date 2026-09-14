"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import {
  BookOpen, PenTool, FlaskConical, Code2, Presentation,
  ArrowRight, ArrowLeft, Sparkles, Zap,
} from "lucide-react";
import Image from "next/image";

const TOOLS = [
  {
    id: "notebook",
    title: "Notebook LLM",
    desc: "Upload documents and chat with them using advanced RAG strategies. Get cited answers grounded in your sources.",
    icon: <BookOpen className="w-7 h-7 text-white" />,
    gradient: "from-indigo-500 to-violet-500",
    shadow: "rgba(99,102,241,0.3)",
    href: "/research/notebook",
    badge: "RAG Chat",
    features: ["Document Upload", "Vector Search", "Citations", "Multi-doc"],
  },
  {
    id: "presentation",
    title: "AI Presentation Generator",
    desc: "Transform any topic, notes, or uploaded documents into structured presentation decks. Live preview, inline edits & instant .pptx export.",
    icon: <Presentation className="w-7 h-7 text-white" />,
    gradient: "from-emerald-500 to-teal-600",
    shadow: "rgba(16,185,129,0.3)",
    href: "/research/presentation",
    badge: "PPT Gen",
    features: ["Custom Slide Count", "16:9 Live Preview", "Export .pptx", "Multiple Themes"],
  },
  {
    id: "human-writer",
    title: "Human Writer",
    desc: "Upload samples of your writing style. The AI learns your voice and generates content that sounds authentically like you.",
    icon: <PenTool className="w-7 h-7 text-white" />,
    gradient: "from-rose-500 to-pink-500",
    shadow: "rgba(244,63,94,0.3)",
    href: "/research/human-writer",
    badge: "Style AI",
    features: ["Style Learning", "Voice Matching", "Content Gen", "Tone Control"],
  },
  {
    id: "ai-research",
    title: "AI Research Summary",
    desc: "Feed your research across 4 nodes - idea, prior work, methodology, findings - and watch agents synthesize a full paper.",
    icon: <FlaskConical className="w-7 h-7 text-white" />,
    gradient: "from-amber-500 to-orange-500",
    shadow: "rgba(245,158,11,0.3)",
    href: "/research/ai-research",
    badge: "Agent",
    features: ["4 Input Nodes", "Photon Animation", "Multi-format", "IEEE / Springer"],
  },
  {
    id: "coding",
    title: "AI Coding Assistant",
    desc: "Upload your local codebase and chat with it. Get contextual edits, explanations, and refactoring suggestions like Cursor.",
    icon: <Code2 className="w-7 h-7 text-white" />,
    gradient: "from-cyan-500 to-teal-500",
    shadow: "rgba(6,182,212,0.3)",
    href: "/research/coding",
    badge: "Code AI",
    features: ["Codebase Upload", "Chat & Edit", "Refactor", "Explain Code"],
  },
];

export default function ResearchHubPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[140px] bg-indigo-200/60 pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full blur-[120px] bg-violet-200/50 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[120px] bg-amber-200/30 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Agento" width={100} height={60} className="opacity-90" />
            <div className="h-6 w-px bg-slate-200" />
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
            <FlaskConical className="w-3.5 h-3.5" /> Research Suite
          </div>
        </div>

        {/* Hero */}
        <div className="mb-12">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-amber-500 p-8 relative overflow-hidden shadow-lg shadow-indigo-200">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[60px] bg-white/10" />
            <div className="absolute bottom-0 left-1/2 w-64 h-32 rounded-full blur-[80px] bg-amber-300/20" />
            <div className="relative z-10 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span className="text-indigo-200 text-sm font-medium">5 Powerful Research Tools</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Research Hub</h1>
              <p className="text-indigo-100 text-sm md:text-base max-w-xl">
                From notebook-style RAG chats and AI presentation deck builders to automated research papers and coding assistants - your full toolkit in one place.
              </p>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-500" /> Choose a Tool
        </h2>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => router.push(tool.href)}
              className="card-3d group relative w-full text-left rounded-2xl p-6 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px ${tool.shadow}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {/* Hover overlay */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-[0.06] transition-opacity bg-gradient-to-br ${tool.gradient} rounded-2xl`}
              />

              {/* Badge */}
              <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                {tool.badge}
              </span>

              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${tool.gradient} mb-5 shadow-lg`}>
                {tool.icon}
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-2">{tool.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{tool.desc}</p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tool.features.map((f) => (
                  <span
                    key={f}
                    className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium"
                  >
                    {f}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-indigo-500 transition-colors">
                Open tool <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-12">
          Research Suite - powered by Agento AI · All tools are session-isolated and private
        </p>
      </div>
    </main>
  );
}
