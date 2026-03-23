"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bot, FileText, LogOut, Mic, Shield, Zap, CreditCard,
  MessageSquare, BarChart3, Database, ArrowRight, Sparkles,
  TrendingUp, Clock, CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import PricingModal from "@/components/PricingModal";

interface FeatureUsage {
  chat: { used: number; limit: number };
  voice: { used: number; limit: number };
  query: { used: number; limit: number };
  unlimited: boolean;
}

function UsageBar({ used, limit, unlimited, color }: { used: number; limit: number; unlimited: boolean; color: string }) {
  const pct = unlimited ? 0 : Math.min((used / limit) * 100, 100);
  const near = pct >= 80;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-600">{unlimited ? "Unlimited" : `${used} / ${limit} calls`}</span>
        {!unlimited && <span className={near ? "text-red-500" : "text-slate-500"}>{Math.round(pct)}%</span>}
      </div>
      {!unlimited && (
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${near ? "bg-red-500" : color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function FeatureCard({
  icon, title, desc, gradient, shadowColor, onClick, disabled,
  usage, usageColor, badge, unlimited = false,
}: {
  icon: React.ReactNode; title: string; desc: string;
  gradient: string; shadowColor: string; onClick: () => void;
  disabled?: boolean; usage?: { used: number; limit: number };
  usageColor: string; badge?: string; unlimited?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`card-3d group relative w-full text-left rounded-2xl p-6 border transition-all duration-300 overflow-hidden
        ${disabled
          ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-1 cursor-pointer"
        }`}
      style={{ boxShadow: disabled ? "none" : undefined }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px ${shadowColor}`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.07] transition-opacity bg-gradient-to-br ${gradient} rounded-2xl`} />

      {badge && (
        <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          {badge}
        </span>
      )}

      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} mb-4 shadow-lg`}>
        {icon}
      </div>

      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>

      {usage && <UsageBar used={usage.used} limit={usage.limit} unlimited={unlimited} color={usageColor} />}

      {!disabled && (
        <div className="mt-4 flex items-center gap-1 text-xs text-slate-500 group-hover:text-indigo-500 transition-colors">
          Open <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </button>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/auth/usage")
      .then(r => r.json())
      .then((d: FeatureUsage) => {
        setFeatureUsage(d);
      })
      .catch(() => {});
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const plan = (session?.user as { subscriptionPlan?: string })?.subscriptionPlan ?? "starter";
  const isAdmin = session?.user?.role === "admin";
  const totalUsed = (featureUsage?.chat.used ?? 0) + (featureUsage?.voice.used ?? 0) + (featureUsage?.query.used ?? 0);
  const totalLimit = (featureUsage?.chat.limit ?? 10) + (featureUsage?.voice.limit ?? 10) + (featureUsage?.query.limit ?? 10);
  const unlimited = featureUsage?.unlimited ?? false;
  const limitReached = featureUsage && !unlimited &&
    featureUsage.chat.used >= featureUsage.chat.limit &&
    featureUsage.voice.used >= featureUsage.voice.limit &&
    featureUsage.query.used >= featureUsage.query.limit;

  const planLabel: Record<string, string> = {
    starter: "Starter · Free",
    "pro-chat": "Pro · AI Chat + Voice",
    "pro-query": "Pro · Query Genius",
    business: "Business",
  };

  const planColor: Record<string, string> = {
    starter: "bg-slate-100 text-slate-600 border-slate-200",
    "pro-chat": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "pro-query": "bg-blue-50 text-blue-700 border-blue-200",
    business: "bg-violet-50 text-violet-700 border-violet-200",
  };

  const chatUsage = featureUsage?.chat ?? { used: 0, limit: 10 };
  const voiceUsage = featureUsage?.voice ?? { used: 0, limit: 10 };
  const queryUsage = featureUsage?.query ?? { used: 0, limit: 10 };

  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">

      {/* Background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[140px] bg-indigo-200/60 pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full blur-[120px] bg-violet-200/50 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[120px] bg-blue-200/40 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Agento" width={100} height={60} className="opacity-90" />
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <p className="text-sm text-slate-500">Welcome back,</p>
              <p className="font-semibold text-slate-900">{session?.user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${planColor[plan] ?? planColor.starter}`}>
              {planLabel[plan] ?? plan}
            </span>
            <button onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all text-sm">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>

        {/* ── Hero greeting ── */}
        <div className="mb-10">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 md:p-8 relative overflow-hidden shadow-lg shadow-indigo-200">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[60px] bg-white/10" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span className="text-indigo-200 text-sm font-medium">{session?.user?.company_name}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Good to see you, {session?.user?.name?.split(" ")[0]} 👋
                </h1>
                <p className="text-indigo-200 mt-1 text-sm">What would you like to explore today?</p>
              </div>
              {featureUsage && !unlimited && (
                <div className="flex flex-col items-end gap-2 min-w-[160px]">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-indigo-200" />
                    <span className="text-indigo-100">Total usage</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{totalUsed} <span className="text-indigo-200 text-base font-normal">/ {totalLimit}</span></div>
                  <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${limitReached ? "bg-red-400" : "bg-white"}`}
                      style={{ width: `${Math.min((totalUsed / totalLimit) * 100, 100)}%` }} />
                  </div>
                  {limitReached && (
                    <button onClick={() => setShowPricing(true)} className="text-xs text-white underline underline-offset-2 hover:text-indigo-100">
                      Upgrade plan
                    </button>
                  )}
                </div>
              )}
              {unlimited && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 border border-white/30">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">Unlimited calls</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Feature cards ── */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" /> Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <FeatureCard
              icon={<Bot className="w-6 h-6 text-white" />}
              title="AI Chat"
              desc="Chat with your documents. Get cited answers with multi-step reasoning."
              gradient="from-indigo-500 to-blue-500"
              shadowColor="rgba(99,102,241,0.25)"
              onClick={() => router.push("/chat")}
              usage={chatUsage}
              unlimited={unlimited}
              usageColor="bg-indigo-500"
            />

            <FeatureCard
              icon={<Mic className="w-6 h-6 text-white" />}
              title="Voice Call"
              desc="Talk to your knowledge base. Real-time voice queries, instant answers."
              gradient="from-violet-500 to-purple-500"
              shadowColor="rgba(139,92,246,0.25)"
              onClick={() => router.push("/voice-call")}
              usage={voiceUsage}
              unlimited={unlimited}
              usageColor="bg-violet-500"
            />

            <FeatureCard
              icon={<BarChart3 className="w-6 h-6 text-white" />}
              title="Query Genius"
              desc="Natural language to SQL. Explore structured data without writing queries."
              gradient="from-cyan-500 to-teal-500"
              shadowColor="rgba(6,182,212,0.25)"
              onClick={() => router.push("/query-genius")}
              usage={queryUsage}
              unlimited={unlimited}
              usageColor="bg-cyan-500"
            />

          </div>
        </div>

        {/* ── Admin + Tools ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {isAdmin && (
            <>
              <FeatureCard
                icon={<Shield className="w-6 h-6 text-white" />}
                title="Admin Panel"
                desc="Manage employees, verify accounts, and handle subscription requests."
                gradient="from-green-500 to-emerald-500"
                shadowColor="rgba(34,197,94,0.2)"
                onClick={() => router.push("/admin")}
                usageColor=""
                badge="Admin"
              />
              <FeatureCard
                icon={<Database className="w-6 h-6 text-white" />}
                title="Ingest Document"
                desc="Upload and index new documents into the knowledge base."
                gradient="from-amber-500 to-orange-500"
                shadowColor="rgba(245,158,11,0.2)"
                onClick={() => router.push("/ingest-doc")}
                usageColor=""
                badge="Admin"
              />
            </>
          )}

          <FeatureCard
            icon={<CreditCard className="w-6 h-6 text-white" />}
            title="Pricing & Plans"
            desc="View plans, request an upgrade, or check your current subscription."
            gradient="from-rose-500 to-pink-500"
            shadowColor="rgba(244,63,94,0.2)"
            onClick={() => router.push("/pricing")}
            usageColor=""
          />

          <FeatureCard
            icon={<FileText className="w-6 h-6 text-white" />}
            title="Chat History"
            desc="Browse and continue your previous AI chat sessions."
            gradient="from-slate-500 to-slate-600"
            shadowColor="rgba(100,116,139,0.2)"
            onClick={() => router.push("/chat")}
            usageColor=""
          />
        </div>

        {/* ── Quick stats row ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <MessageSquare className="w-4 h-4 text-indigo-500" />, label: "Chat calls", value: unlimited ? "∞" : `${chatUsage.used}/${chatUsage.limit}` },
            { icon: <Mic className="w-4 h-4 text-violet-500" />, label: "Voice calls", value: unlimited ? "∞" : `${voiceUsage.used}/${voiceUsage.limit}` },
            { icon: <BarChart3 className="w-4 h-4 text-cyan-500" />, label: "Query calls", value: unlimited ? "∞" : `${queryUsage.used}/${queryUsage.limit}` },
          ].map((s, i) => (
            <div key={i} className="rounded-xl bg-white border border-slate-200 p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-50">{s.icon}</div>
              <div>
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className="text-sm font-semibold text-slate-900">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Upgrade nudge ── */}
        {featureUsage && !unlimited && !limitReached && (
          <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-sm font-medium text-slate-800">Enjoying Agento?</p>
                <p className="text-xs text-slate-500">Upgrade for 500+ calls/month and unlock all features.</p>
              </div>
            </div>
            <button onClick={() => router.push("/pricing")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all hover:-translate-y-0.5 shadow-sm">
              View Plans <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Inline pricing when limit hit */}
        {limitReached && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <PricingModal used={totalUsed} limit={totalLimit} inline />
          </div>
        )}
      </div>

      {/* Pricing modal */}
      {showPricing && !limitReached && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <PricingModal used={totalUsed} limit={totalLimit} onClose={() => setShowPricing(false)} />
        </div>
      )}
    </main>
  );
}
