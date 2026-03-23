"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Mic, Zap, FileText, ArrowRight, ChevronDown,
  Database, Brain, Sparkles, MessageSquare, BarChart3, Lock, Globe,
} from "lucide-react";

function useInView(threshold = 0.15): { ref: React.RefObject<HTMLDivElement | null>; visible: boolean } {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
}

function FloatCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-3d rounded-2xl backdrop-blur-xl border border-slate-200 shadow-xl bg-white ${className}`}>
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: <Brain className="w-6 h-6" />, title: "Agentic RAG", desc: "Multi-step reasoning over your documents. Agento does not just retrieve, it thinks.", color: "from-indigo-500 to-blue-500" },
  { icon: <Mic className="w-6 h-6" />, title: "Voice Call Mode", desc: "Talk to your knowledge base naturally. Real-time voice queries with instant answers.", color: "from-violet-500 to-purple-500" },
  { icon: <BarChart3 className="w-6 h-6" />, title: "Query Genius", desc: "Natural language to SQL. Explore your structured data without writing a single query.", color: "from-cyan-500 to-teal-500" },
  { icon: <Database className="w-6 h-6" />, title: "Smart Ingestion", desc: "Upload PDFs, docs, spreadsheets. Agento chunks, embeds, and indexes automatically.", color: "from-amber-500 to-orange-500" },
  { icon: <MessageSquare className="w-6 h-6" />, title: "Chat with Citations", desc: "Every answer links back to the source. Know exactly where your insights come from.", color: "from-green-500 to-emerald-500" },
  { icon: <Lock className="w-6 h-6" />, title: "Company-Scoped", desc: "Your data stays yours. Isolated per company, role-based access, admin controls.", color: "from-rose-500 to-pink-500" },
];

const STATS = [
  { value: "10x", label: "Faster document search" },
  { value: "99%", label: "Answer accuracy" },
  { value: "<2s", label: "Average response time" },
  { value: "Inf", label: "Documents supported" },
];

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [parallax, setParallax] = useState({ px: 0, py: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setParallax({
        px: (e.clientX / window.innerWidth - 0.5) * 20,
        py: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const { px, py } = parallax;

  return (
    <main className="relative bg-slate-50 text-slate-900 overflow-x-hidden">

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">

        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] bg-indigo-300/50 pointer-events-none transition-transform duration-100"
          style={{ transform: `translate(${px * 0.4}px, ${py * 0.4}px)` }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] bg-violet-300/40 pointer-events-none transition-transform duration-100"
          style={{ transform: `translate(${-px * 0.25}px, ${-py * 0.25}px)` }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[180px] bg-blue-200/40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-indigo-300/20 animate-spin-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-violet-300/20 animate-spin-slow pointer-events-none" style={{ animationDirection: "reverse", animationDuration: "15s" }} />

        <div className="absolute top-24 left-8 md:left-24 animate-float hidden md:block">
          <FloatCard className="p-4 w-48">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-slate-500">AI Processing</span>
            </div>
            <div className="text-sm font-semibold text-slate-800">Analyzing 847 docs</div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-indigo-500 to-blue-400" />
            </div>
          </FloatCard>
        </div>

        <div className="absolute top-32 right-8 md:right-24 animate-float-slow hidden md:block" style={{ animationDelay: "2s" }}>
          <FloatCard className="p-4 w-44">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-4 h-4 text-violet-500" />
              <span className="text-xs text-slate-500">Voice Query</span>
            </div>
            <div className="text-sm font-semibold text-slate-800">Show Q3 revenue</div>
            <div className="mt-2 flex gap-0.5 items-end h-6">
              {[3,5,8,4,7,9,5,3,6,8,4,6].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-violet-400/70" style={{ height: `${h * 3}px` }} />
              ))}
            </div>
          </FloatCard>
        </div>

        <div className="absolute bottom-32 left-8 md:left-32 animate-float-fast hidden md:block" style={{ animationDelay: "1s" }}>
          <FloatCard className="p-4 w-52">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-cyan-500" />
              <span className="text-xs text-slate-500">Query Genius</span>
            </div>
            <div className="text-xs text-slate-500 font-mono">SELECT revenue FROM q3</div>
            <div className="mt-2 text-lg font-bold text-cyan-600">Rs 2.4M up 18%</div>
          </FloatCard>
        </div>

        <div className="absolute bottom-40 right-8 md:right-32 animate-float hidden md:block" style={{ animationDelay: "3s" }}>
          <FloatCard className="p-4 w-48">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-slate-500">Citation</span>
            </div>
            <div className="text-xs text-slate-700 font-medium">Policy.pdf Page 12</div>
            <div className="text-xs text-slate-500 mt-1">Leave policy updated Jan 2024</div>
          </FloatCard>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" /> Agentic AI for your company knowledge
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 animate-fade-up text-slate-900">
            Your documents,{" "}
            <span className="gradient-text">thinking for you</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 animate-fade-up delay-200">
            Agento is an agentic RAG engine that lets your team chat, call, and query across all company documents with AI that reasons, not just retrieves.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-300">
            {status === "authenticated" ? (
              <button onClick={() => router.push("/dashboard")}
                className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-lg hover:from-indigo-500 hover:to-violet-500 transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(99,102,241,0.35)]">
                Go to Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button onClick={() => router.push("/signup")}
                  className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-lg hover:from-indigo-500 hover:to-violet-500 transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(99,102,241,0.35)]">
                  Get Started Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => router.push("/login")}
                  className="px-8 py-4 rounded-2xl border border-slate-300 text-slate-700 font-semibold text-lg hover:bg-slate-100 hover:border-slate-400 transition-all">
                  Sign In
                </button>
              </>
            )}
          </div>

          <div className="mt-16 flex justify-center animate-fade-in delay-500">
            <div className="relative">
              <div className="absolute inset-0 flex justify-center items-center">
                <div className="w-40 h-40 rounded-full blur-[60px] bg-indigo-300/50" />
              </div>
              <Image src="/logo.png" alt="Agento" width={280} height={170} className="relative z-10 opacity-95 drop-shadow-xl" priority />
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 animate-bounce">
          <span className="text-xs font-medium">Scroll to explore</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 px-6 border-y border-slate-200 bg-white">
        <FadeSection>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">{s.value}</div>
                <div className="text-slate-600 text-sm font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </FadeSection>
      </section>

      {/* FEATURES */}
      <section className="py-28 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <FadeSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-sm font-medium mb-5">
                <Zap className="w-3.5 h-3.5" /> Everything your team needs
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
                Built for how teams <span className="gradient-text">actually work</span>
              </h2>
              <p className="text-slate-600 text-lg max-w-xl mx-auto">
                From chat to voice to SQL, one platform, all your knowledge.
              </p>
            </div>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <FadeSection key={i}>
                <div className="card-3d group relative rounded-2xl bg-white border border-slate-200 p-6 hover:border-slate-300 hover:shadow-lg transition-all duration-300 cursor-default overflow-hidden">
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity bg-gradient-to-br ${f.color} rounded-2xl`} />
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${f.color} mb-4 shadow-md`}>
                    <span className="text-white">{f.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-28 px-6 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <FadeSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
                Up and running in <span className="gradient-text-gold">3 steps</span>
              </h2>
            </div>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: <FileText className="w-8 h-8" />, title: "Upload your docs", desc: "PDFs, Word files, spreadsheets, drag and drop. Agento handles chunking and embedding automatically." },
              { step: "02", icon: <Brain className="w-8 h-8" />, title: "Agento learns", desc: "Our agentic pipeline indexes your content, builds a knowledge graph, and prepares multi-step reasoning." },
              { step: "03", icon: <Globe className="w-8 h-8" />, title: "Ask anything", desc: "Chat, call, or query. Get cited answers in seconds. Share insights with your whole team." },
            ].map((s, i) => (
              <FadeSection key={i}>
                <div className="relative text-center">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-indigo-300 to-transparent z-10" />
                  )}
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 mb-6 text-indigo-600">
                    {s.icon}
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">{s.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{s.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 bg-slate-50">
        <FadeSection>
          <div className="max-w-3xl mx-auto text-center">
            <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-12 overflow-hidden shadow-2xl shadow-indigo-200">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] bg-white/10" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] bg-white/10" />
              <div className="relative z-10">
                <Sparkles className="w-10 h-10 text-indigo-200 mx-auto mb-4" />
                <h2 className="text-4xl font-bold mb-4 text-white">Ready to get started?</h2>
                <p className="text-indigo-100 mb-8 text-lg">10 free AI calls per feature. No credit card required.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={() => router.push(status === "authenticated" ? "/dashboard" : "/signup")}
                    className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-all hover:-translate-y-1 hover:shadow-xl">
                    {status === "authenticated" ? "Open Dashboard" : "Start for Free"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => router.push("/pricing")}
                    className="px-8 py-4 rounded-2xl border border-white/40 text-white font-semibold hover:bg-white/10 transition-all">
                    View Pricing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </FadeSection>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Agento" width={80} height={48} className="opacity-80" />
            <span className="text-slate-600 text-sm font-medium">Agentic RAG Engine</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <button onClick={() => router.push("/pricing")} className="hover:text-slate-900 transition-colors">Pricing</button>
            <button onClick={() => router.push("/login")} className="hover:text-slate-900 transition-colors">Login</button>
            <button onClick={() => router.push("/signup")} className="hover:text-slate-900 transition-colors">Sign Up</button>
          </div>
          <p className="text-slate-500 text-xs">2025 Agento. All rights reserved.</p>
        </div>
      </footer>

    </main>
  );
}
