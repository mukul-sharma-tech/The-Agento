"use client";

import { useState } from "react";
import { Check, Zap, X, Loader2 } from "lucide-react";

const PRO_OPTIONS = [
  {
    key: "pro-chat",
    label: "AI Chat + Voice",
    features: ["500 AI calls/month", "AI Chat assistant", "Voice Call mode", "Unlimited documents", "Priority support"],
  },
  {
    key: "pro-query",
    label: "Query Genius",
    features: ["500 AI calls/month", "Query Genius (full access)", "Analytics suite", "Unlimited documents", "Priority support"],
  },
];

const CM: Record<string, { border: string; bg: string; badge: string; btn: string; icon: string }> = {
  slate:  { border: "border-slate-200 dark:border-slate-700",   bg: "bg-white/60 dark:bg-white/5",           badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",    btn: "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-default", icon: "text-slate-400" },
  indigo: { border: "border-indigo-400 dark:border-indigo-500", bg: "bg-indigo-50/80 dark:bg-indigo-900/20", badge: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300", btn: "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white", icon: "text-indigo-500" },
  violet: { border: "border-violet-300 dark:border-violet-700", bg: "bg-white/60 dark:bg-white/5",           badge: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",  btn: "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white", icon: "text-violet-500" },
};

interface Props {
  used: number;
  limit: number;
  onClose?: () => void;
  inline?: boolean;
}

export default function PricingModal({ used, limit, onClose, inline = false }: Props) {
  const [proOption, setProOption] = useState<"pro-chat" | "pro-query">("pro-chat");
  const [requesting, setRequesting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const handleRequest = async (plan: string) => {
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
      setToast({ msg: "Something went wrong.", ok: false });
    } finally {
      setRequesting(null);
      setTimeout(() => setToast(null), 12000);
    }
  };

  const selectedPro = PRO_OPTIONS.find(o => o.key === proOption)!;

  const content = (
    <div className={`${inline ? "w-full" : "relative w-full max-w-4xl mx-auto"} px-4`}>
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium text-white text-center ${toast.ok ? "bg-green-600" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium mb-4">
          <Zap className="w-3.5 h-3.5" /> You&apos;ve used {used}/{limit} free AI calls
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Upgrade to keep going</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Hit the free tier limit. Pick a plan to continue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Starter */}
        <div className={`relative flex flex-col rounded-2xl border-2 ${CM.slate.border} ${CM.slate.bg} backdrop-blur-xl p-6 shadow-lg`}>
          <div className="mb-4">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${CM.slate.badge}`}>10 calls per feature</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Starter</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Try every feature before you buy</p>
          </div>
          <div className="mb-5">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">Free</span>
          </div>
          <ul className="space-y-2.5 mb-6 flex-1">
            {["10 chat calls (free)", "10 voice calls (free)", "10 query calls (free)", "1 document upload"].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className={`w-4 h-4 flex-shrink-0 ${CM.slate.icon}`} />{f}
              </li>
            ))}
          </ul>
          <button disabled className={`w-full py-2.5 rounded-xl text-sm font-semibold ${CM.slate.btn}`}>Current Plan</button>
        </div>

        {/* Pro */}
        <div className={`relative flex flex-col rounded-2xl border-2 ${CM.indigo.border} ${CM.indigo.bg} backdrop-blur-xl p-6 shadow-lg`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-semibold">
            Most Popular
          </div>
          <div className="mb-3">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${CM.indigo.badge}`}>500 AI calls/mo</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Pro</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Pick your module</p>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-indigo-300 dark:border-indigo-700 mb-4">
            {PRO_OPTIONS.map(opt => (
              <button key={opt.key}
                onClick={() => setProOption(opt.key as "pro-chat" | "pro-query")}
                className={`flex-1 py-1.5 text-xs font-semibold transition-all ${proOption === opt.key ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"}`}>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="mb-5">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">₹350</span>
            <span className="text-slate-500 dark:text-slate-400 text-sm">/month</span>
          </div>
          <ul className="space-y-2.5 mb-6 flex-1">
            {selectedPro.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className={`w-4 h-4 flex-shrink-0 ${CM.indigo.icon}`} />{f}
              </li>
            ))}
          </ul>
          <button
            disabled={requesting === proOption}
            onClick={() => handleRequest(proOption)}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${CM.indigo.btn}`}>
            {requesting === proOption
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              : `Request · ${selectedPro.label}`}
          </button>
        </div>

        {/* Business */}
        <div className={`relative flex flex-col rounded-2xl border-2 ${CM.violet.border} ${CM.violet.bg} backdrop-blur-xl p-6 shadow-lg`}>
          <div className="mb-4">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${CM.violet.badge}`}>Unlimited AI calls</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Business</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Everything, for growing teams</p>
          </div>
          <div className="mb-5">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">₹699</span>
            <span className="text-slate-500 dark:text-slate-400 text-sm">/month</span>
          </div>
          <ul className="space-y-2.5 mb-6 flex-1">
            {["Unlimited AI calls", "AI Chat + Voice Call", "Query Genius (full access)", "Analytics suite", "Dedicated support"].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className={`w-4 h-4 flex-shrink-0 ${CM.violet.icon}`} />{f}
              </li>
            ))}
          </ul>
          <button
            disabled={requesting === "business"}
            onClick={() => handleRequest("business")}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${CM.violet.btn}`}>
            {requesting === "business"
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              : "Request Business"}
          </button>
        </div>

      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
        Pilot launch pricing · Plans activate within 24 hours of request
      </p>
    </div>
  );

  if (inline) return <div className="py-8">{content}</div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 overflow-y-auto max-h-[90vh]">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
        {content}
      </div>
    </div>
  );
}
