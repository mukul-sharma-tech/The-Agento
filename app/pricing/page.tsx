"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Check, Zap, CreditCard, Shield, Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";

const PRO_OPTIONS = [
  {
    key: "pro-chat",
    label: "AI Chat + Voice Call",
    features: ["500 AI calls / month", "AI Chat assistant", "Voice Call mode", "Unlimited document uploads", "Priority support"],
  },
  {
    key: "pro-query",
    label: "Query Genius",
    features: ["500 AI calls / month", "Query Genius (full access)", "Analytics suite", "Unlimited document uploads", "Priority support"],
  },
];

const COLOR: Record<string, { border: string; bg: string; badge: string; btn: string; check: string; ring: string }> = {
  slate:  { border: "border-slate-200 dark:border-slate-700",   bg: "bg-white/60 dark:bg-white/5",           badge: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",      btn: "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-default",                                                    check: "text-slate-400",  ring: "" },
  indigo: { border: "border-indigo-400 dark:border-indigo-500", bg: "bg-indigo-50/70 dark:bg-indigo-900/20", badge: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300", btn: "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/30", check: "text-indigo-500", ring: "ring-2 ring-indigo-400/40" },
  violet: { border: "border-violet-300 dark:border-violet-700", bg: "bg-white/60 dark:bg-white/5",           badge: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",  btn: "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30", check: "text-violet-500", ring: "" },
};

const FAQ = [
  { q: "What counts as an AI call?", a: "Any request that hits the LLM — a chat message, a voice query, a Query Genius operation, or an analytics run. Uploads and schema reads don't count." },
  { q: "What's the difference between Pro and Business?", a: "Pro (₹350/mo) lets you pick either AI Chat + Voice Call OR Query Genius. Business (₹699/mo) gives you both together with unlimited calls." },
  { q: "How do I activate my plan?", a: "Click the request button, and our team will confirm your plan within 24 hours. You'll get an email once it's active." },
  { q: "Is there a team plan?", a: "Business covers your whole company under one account. Reach out if you need volume pricing for multiple teams." },
];

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [proOption, setProOption] = useState<"pro-chat" | "pro-query">("pro-chat");
  const [requesting, setRequesting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const handleRequest = async (plan: string) => {
    if (!session?.user) { router.push("/login"); return; }
    setRequesting(plan);
    try {
      const res = await fetch("/api/auth/subscription/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (res.ok) {
        const upi = process.env.NEXT_PUBLIC_ADMIN_UPI_PHONE_NO || "";
        setToast({
          msg: `Request sent! Pay ${plan === "business" ? "₹699" : "₹350"} to UPI ${upi} and reply to the confirmation email with your screenshot.`,
          ok: true,
        });
      } else {
        setToast({ msg: data.message, ok: false });
      }
    } catch {
      setToast({ msg: "Something went wrong. Try again.", ok: false });
    } finally {
      setRequesting(null);
      setTimeout(() => setToast(null), 12000);
    }
  };

  const selectedPro = PRO_OPTIONS.find(o => o.key === proOption)!;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100 dark:bg-[#0b1220]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 max-w-sm px-5 py-4 rounded-xl shadow-lg text-sm font-medium text-white leading-relaxed ${toast.ok ? "bg-green-600" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-white to-blue-100 dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40 pointer-events-none" />
      <div className="absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px] bg-blue-300/40 dark:bg-blue-700/20 pointer-events-none" />
      <div className="absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px] bg-indigo-300/35 dark:bg-indigo-800/25 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[520px] h-[520px] rounded-full blur-[110px] bg-amber-300/20 dark:bg-amber-700/10 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
        <button onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-500" />
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Pricing</h1>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex justify-center"><div className="w-10 h-10 bg-amber-400/20 rounded-full blur-[20px]" /></div>
          <Image src="/logo.png" alt="Logo" width={100} height={57} className="relative z-10 opacity-80" />
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-14">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Pilot launch pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Choose your plan
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Start free, pick what you need. No hidden fees.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">

          {/* Starter */}
          <div className={`relative flex flex-col rounded-2xl border-2 ${COLOR.slate.border} ${COLOR.slate.bg} backdrop-blur-xl p-7 shadow-xl transition-transform hover:-translate-y-1`}>
            <div className="mb-5">
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${COLOR.slate.badge}`}>10 calls per feature</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Starter</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try every feature before you buy.</p>
            </div>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-slate-900 dark:text-slate-100">Free</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["10 chat calls (free)", "10 voice calls (free)", "10 query calls (free)", "1 document upload", "Community support"].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${COLOR.slate.check}`} />{f}
                </li>
              ))}
            </ul>
            <button disabled className={`w-full py-3 rounded-xl text-sm font-semibold ${COLOR.slate.btn}`}>
              Current Plan
            </button>
          </div>

          {/* Pro — with module toggle */}
          <div className={`relative flex flex-col rounded-2xl border-2 ${COLOR.indigo.border} ${COLOR.indigo.bg} ${COLOR.indigo.ring} backdrop-blur-xl p-7 shadow-xl transition-transform hover:-translate-y-1`}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-lg">
              <Zap className="w-3 h-3" /> Most Popular
            </div>
            <div className="mb-4">
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${COLOR.indigo.badge}`}>500 AI calls / month</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pro</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pick the module you need.</p>
            </div>

            {/* Module toggle */}
            <div className="flex rounded-xl overflow-hidden border border-indigo-300 dark:border-indigo-700 mb-5">
              {PRO_OPTIONS.map(opt => (
                <button key={opt.key}
                  onClick={() => setProOption(opt.key as "pro-chat" | "pro-query")}
                  className={`flex-1 py-2 px-2 text-xs font-semibold transition-all ${proOption === opt.key ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"}`}>
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <span className="text-5xl font-extrabold text-slate-900 dark:text-slate-100">₹350</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm ml-1">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {selectedPro.features.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${COLOR.indigo.check}`} />{f}
                </li>
              ))}
            </ul>
            <button
              disabled={requesting === proOption}
              onClick={() => handleRequest(proOption)}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${COLOR.indigo.btn}`}>
              {requesting === proOption
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending request...</>
                : `Request · ${selectedPro.label}`}
            </button>
          </div>

          {/* Business */}
          <div className={`relative flex flex-col rounded-2xl border-2 ${COLOR.violet.border} ${COLOR.violet.bg} backdrop-blur-xl p-7 shadow-xl transition-transform hover:-translate-y-1`}>
            <div className="mb-5">
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${COLOR.violet.badge}`}>Unlimited AI calls</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Business</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Everything, for growing teams.</p>
            </div>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-slate-900 dark:text-slate-100">₹699</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm ml-1">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["Unlimited AI calls", "AI Chat + Voice Call", "Query Genius (full access)", "Analytics suite", "Dedicated support"].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${COLOR.violet.check}`} />{f}
                </li>
              ))}
            </ul>
            <button
              disabled={requesting === "business"}
              onClick={() => handleRequest("business")}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${COLOR.violet.btn}`}>
              {requesting === "business"
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending request...</>
                : "Request Business"}
            </button>
          </div>

        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-16">
          {[
            { icon: <Shield className="w-4 h-4" />, text: "Secure payments" },
            { icon: <Zap className="w-4 h-4" />, text: "Activates within 24h" },
            { icon: <CreditCard className="w-4 h-4" />, text: "Cancel anytime" },
          ].map(b => (
            <div key={b.text} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
              <span className="text-indigo-500">{b.icon}</span> {b.text}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-8">Frequently asked questions</h3>
          <div className="space-y-4">
            {FAQ.map(item => (
              <div key={item.q} className="rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl px-6 py-5">
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5">{item.q}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA footer */}
        <div className="mt-16 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">Need a custom plan or have questions?</p>
          <a href={`mailto:${process.env.NEXT_PUBLIC_ADMIN_MAIL || "support@agento.ai"}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors">
            Contact us
          </a>
        </div>

      </div>
    </main>
  );
}
