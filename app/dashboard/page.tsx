"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bot, FileText, LogOut, Mic, Shield, Zap, CreditCard } from "lucide-react";
import Image from "next/image";
import PricingModal from "@/components/PricingModal";

interface Usage { used: number; limit: number; unlimited: boolean }

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/auth/usage")
        .then(r => r.json())
        .then((d: Usage) => {
          setUsage(d);
          if (!d.unlimited && d.used >= d.limit) setShowPricing(true);
        })
        .catch(() => {});
    }
  }, [status]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0b1220]">
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </main>
    );
  }

  const limitReached = usage && !usage.unlimited && usage.used >= usage.limit;

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-6 bg-slate-100 dark:bg-[#0b1220]">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-white to-blue-100 dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40" />
      <div className="absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px] bg-blue-300/40 dark:bg-blue-700/20" />
      <div className="absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px] bg-indigo-300/35 dark:bg-indigo-800/25" />
      <div className="absolute bottom-[-200px] left-1/4 w-[520px] h-[520px] rounded-full blur-[110px] bg-cyan-300/30 dark:bg-cyan-700/20" />

      <div className="relative z-10 max-w-4xl w-full text-center">
        {/* Logo */}
        <div className="relative mt-14 mb-8 flex justify-center">
          <div className="absolute inset-0 flex justify-center">
            <div className="w-32 h-32 bg-blue-400/30 dark:bg-blue-600/20 rounded-full blur-[60px]" />
          </div>
          <Image src="/logo.png" alt="Agento Logo" width={500} height={304} className="relative z-10 opacity-90" priority />
        </div>

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome, {session?.user?.name}
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            {session?.user?.company_name} ({session?.user?.role})
          </p>

          {/* Usage pill */}
          {usage && !usage.unlimited && (
            <div className="mt-4 inline-flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 dark:bg-white/10 border border-slate-200 dark:border-slate-700 text-sm">
                <Zap className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-slate-600 dark:text-slate-300">
                  AI calls: <span className={`font-semibold ${limitReached ? "text-red-500" : "text-indigo-600 dark:text-indigo-400"}`}>{usage.used}</span>
                  <span className="text-slate-400"> / {usage.limit}</span>
                </span>
                {limitReached && (
                  <button onClick={() => setShowPricing(true)} className="ml-1 text-xs text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-800">
                    Upgrade
                  </button>
                )}
              </div>
              {/* Progress bar */}
              <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${limitReached ? "bg-red-500" : "bg-indigo-500"}`}
                  style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-5 flex-wrap">
          <Button onClick={() => router.push("/chat")}
            className="h-12 px-10 bg-slate-800 text-white dark:bg-slate-700/60 dark:text-slate-100 border border-black/10 dark:border-white/10 hover:bg-slate-700 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_35px_rgba(59,130,246,0.35)]">
            <Bot className="w-5 h-5 mr-2" /> AI Chat
          </Button>

          <Button onClick={() => router.push("/voice-call")}
            className="h-12 px-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_35px_rgba(139,92,246,0.4)]">
            <Mic className="w-5 h-5 mr-2" /> Voice Call
          </Button>

          {session?.user?.role === "admin" && (
            <>
              <Button onClick={() => router.push("/admin")}
                className="h-12 px-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_35px_rgba(34,197,94,0.4)]">
                <Shield className="w-5 h-5 mr-2" /> Admin Panel
              </Button>
              <Button onClick={() => router.push("/ingest-doc")}
                className="h-12 px-10 bg-slate-800 text-white dark:bg-slate-700/60 dark:text-slate-100 border border-black/10 dark:border-white/10 hover:bg-slate-700 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_35px_rgba(59,130,246,0.35)]">
                <FileText className="w-5 h-5 mr-2" /> Ingest Document
              </Button>
            </>
          )}

          <Button onClick={() => router.push("/query-genius")}
            className="h-12 px-10 bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 hover:from-indigo-700 hover:to-violet-700 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_35px_rgba(99,102,241,0.4)]">
            <Zap className="w-5 h-5 mr-2" /> Query Genius
          </Button>

          <Button onClick={() => signOut({ callbackUrl: "/" })}
            className="h-12 px-10 bg-transparent text-slate-700 dark:text-slate-300 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200">
            <LogOut className="w-5 h-5 mr-2" /> Logout
          </Button>

          <Button onClick={() => router.push("/pricing")}
            className="h-12 px-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_35px_rgba(245,158,11,0.4)]">
            <CreditCard className="w-5 h-5 mr-2" /> Pricing
          </Button>
        </div>

        {/* Inline pricing section when limit reached */}
        {limitReached && (
          <div className="mt-12 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 shadow-xl">
            <PricingModal used={usage!.used} limit={usage!.limit} inline />
          </div>
        )}

        {/* Upgrade link for non-limit users */}
        {usage && !usage.unlimited && !limitReached && (
          <button onClick={() => setShowPricing(true)} className="mt-6 text-xs text-slate-400 hover:text-indigo-500 transition-colors underline underline-offset-2">
            View pricing plans
          </button>
        )}
      </div>

      {/* Pricing modal overlay (triggered by Upgrade button) */}
      {showPricing && !limitReached && (
        <PricingModal used={usage?.used ?? 0} limit={usage?.limit ?? 15} onClose={() => setShowPricing(false)} />
      )}
    </main>
  );
}
