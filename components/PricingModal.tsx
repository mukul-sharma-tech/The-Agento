"use client";

import { Check, Zap, X } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Get started with AI-powered tools",
    calls: "15 AI calls",
    color: "slate",
    features: ["15 AI calls total", "AI Chat", "Voice Call", "Query Genius (basic)", "1 document upload"],
    cta: "Current Plan",
    disabled: true,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For teams that need more power",
    calls: "500 AI calls/mo",
    color: "indigo",
    features: ["500 AI calls/month", "All AI features", "Analytics suite", "Unlimited documents", "Priority support"],
    cta: "Upgrade to Pro",
    disabled: false,
    highlight: true,
  },
  {
    name: "Business",
    price: "$49",
    period: "/month",
    description: "Unlimited for growing companies",
    calls: "Unlimited AI calls",
    color: "violet",
    features: ["Unlimited AI calls", "All Pro features", "Custom integrations", "Dedicated support", "SLA guarantee"],
    cta: "Contact Sales",
    disabled: false,
  },
];

const COLOR_MAP: Record<string, { border: string; bg: string; badge: string; btn: string; icon: string }> = {
  slate:  { border: "border-slate-200 dark:border-slate-700",  bg: "bg-white/60 dark:bg-white/5",          badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",   btn: "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-default", icon: "text-slate-400" },
  indigo: { border: "border-indigo-400 dark:border-indigo-500", bg: "bg-indigo-50/80 dark:bg-indigo-900/20", badge: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300", btn: "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white cursor-pointer", icon: "text-indigo-500" },
  violet: { border: "border-violet-300 dark:border-violet-700", bg: "bg-white/60 dark:bg-white/5",          badge: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",  btn: "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white cursor-pointer", icon: "text-violet-500" },
};

interface Props {
  used: number;
  limit: number;
  onClose?: () => void;
  /** If true, renders inline (no overlay) */
  inline?: boolean;
}

export default function PricingModal({ used, limit, onClose, inline = false }: Props) {
  const content = (
    <div className={`${inline ? "w-full" : "relative w-full max-w-4xl mx-auto"} px-4`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium mb-4">
          <Zap className="w-3.5 h-3.5" />
          You&apos;ve used {used}/{limit} free AI calls
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Upgrade to keep going
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          You&apos;ve hit the free tier limit. Choose a plan to continue using AI Chat, Voice Call, and Query Genius.
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(plan => {
          const c = COLOR_MAP[plan.color];
          return (
            <div key={plan.name}
              className={`relative flex flex-col rounded-2xl border-2 ${c.border} ${c.bg} backdrop-blur-xl p-6 shadow-lg transition-transform hover:-translate-y-0.5`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-semibold">
                  Most Popular
                </div>
              )}
              <div className="mb-4">
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${c.badge}`}>
                  {plan.calls}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{plan.description}</p>
              </div>
              <div className="mb-5">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{plan.price}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <Check className={`w-4 h-4 flex-shrink-0 ${c.icon}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={plan.disabled}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${c.btn}`}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
        Payments coming soon · Contact us to unlock your account early
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
