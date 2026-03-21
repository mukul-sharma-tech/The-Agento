"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Zap, CreditCard, Shield, Sparkles } from "lucide-react";
import Image from "next/image";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Try out AI-powered tools with no commitment.",
    calls: "15 AI calls total",
    color: "slate",
    features: [
      "15 AI calls (lifetime)",
      "AI Chat assistant",
      "Voice Call mode",
      "Query Genius (basic)",
      "1 document upload",
      "Community support",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For teams that need consistent AI power every month.",
    calls: "500 AI calls / month",
    color: "indigo",
    features: [
      "500 AI calls / month",
      "AI Chat + Voice Call",
      "Full Analytics suite",
      "Unlimited document uploads",
      "Query Genius (all operations)",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
    disabled: false,
    highlight: true,
  },
  {
    name: "Business",
    price: "$49",
    period: "/month",
    description: "Unlimited AI for growing companies and large teams.",
    calls: "Unlimited AI calls",
    color: "violet",
    features: [
      "Unlimited AI calls",
      "Everything in Pro",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee (99.9% uptime)",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    disabled: false,
  },
];

const FAQ = [
  { q: "What counts as an AI call?", a: "Any request that hits the LLM — a chat message, a voice query, a Query Genius read/update/delete, or an analytics run. Uploads and schema reads don't count." },
  { q: "Do unused calls roll over?", a: "On Pro and Business plans, calls reset monthly. They don't roll over, but you get a fresh 500 (or unlimited) every billing cycle." },
  { q: "Can I upgrade mid-month?", a: "Yes. You'll be charged a prorated amount and your call count resets immediately on upgrade." },
  { q: "Is there a team plan?", a: "Business covers your whole company under one account. Contact us for volume pricing if you need multiple companies." },
];

const COLOR: Record<string, { border: string; bg: string; badge: string; btn: string; check: string; ring: string }> = {
  slate:  { border: "border-slate-200 dark:border-slate-700",   bg: "bg-white/60 dark:bg-white/5",           badge: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",      btn: "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-default",                                                    check: "text-slate-400",  ring: "" },
  indigo: { border: "border-indigo-400 dark:border-indigo-500", bg: "bg-indigo-50/70 dark:bg-indigo-900/20", badge: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300", btn: "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/30", check: "text-indigo-500", ring: "ring-2 ring-indigo-400/40" },
  violet: { border: "border-violet-300 dark:border-violet-700", bg: "bg-white/60 dark:bg-white/5",           badge: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",  btn: "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30", check: "text-violet-500", ring: "" },
};

export default function PricingPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100 dark:bg-[#0b1220]">
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
            <Sparkles className="w-3.5 h-3.5" /> Simple, transparent pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Choose your plan
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Start free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map(plan => {
            const c = COLOR[plan.color];
            return (
              <div key={plan.name}
                className={`relative flex flex-col rounded-2xl border-2 ${c.border} ${c.bg} ${c.ring} backdrop-blur-xl p-7 shadow-xl transition-transform hover:-translate-y-1`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-lg">
                    <Zap className="w-3 h-3" /> Most Popular
                  </div>
                )}

                <div className="mb-5">
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${c.badge}`}>
                    {plan.calls}
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-5xl font-extrabold text-slate-900 dark:text-slate-100">{plan.price}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.check}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button disabled={plan.disabled}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${c.btn}`}>
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-16">
          {[
            { icon: <Shield className="w-4 h-4" />, text: "Secure payments" },
            { icon: <Zap className="w-4 h-4" />, text: "Instant activation" },
            { icon: <CreditCard className="w-4 h-4" />, text: "Cancel anytime" },
          ].map(b => (
            <div key={b.text} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
              <span className="text-indigo-500">{b.icon}</span> {b.text}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-8">
            Frequently asked questions
          </h3>
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
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
            Need a custom plan or have questions?
          </p>
          <a href="mailto:muku0784@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors">
            Contact us
          </a>
        </div>

      </div>
    </main>
  );
}
