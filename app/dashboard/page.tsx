"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <p className="text-center mt-10 text-slate-400">
        Loading...
      </p>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1220] flex items-center justify-center px-6">

      {/* Background mist */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-[#0b1220] to-blue-900/40" />
      <div className="absolute -top-56 -left-56 w-[620px] h-[620px] bg-slate-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-56 -right-56 w-[620px] h-[620px] bg-blue-800/20 rounded-full blur-3xl" />

      {/* Glow wrapper */}
      <div className="relative z-10">
        <div className="absolute inset-0 rounded-3xl bg-blue-500/10 blur-2xl" />

        {/* Main Card */}
        <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl
          shadow-[0_30px_70px_rgba(0,0,0,0.45)] p-14">

          {/* Inner subtle glow */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 pointer-events-none" />

          {/* Content */}
          <div className="relative">
            <div className="mb-10">
              <h1 className="text-3xl font-semibold text-slate-100 tracking-tight">
                Welcome, {session?.user?.name}
              </h1>
              <p className="mt-2 text-base text-slate-400">
                {session?.user?.companyName}
              </p>
            </div>

            <div className="space-y-5">
              <Button
                onClick={() => router.push("/analyse")}
                className="w-full h-12 bg-slate-700/60 hover:bg-slate-700 text-slate-100
                  border border-white/10 transition-all duration-200
                  hover:-translate-y-[1px]
                  hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_24px_rgba(30,64,175,0.35)]"
              >
                Analyse
              </Button>

              <Button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full h-12 bg-transparent border border-white/10
                  text-slate-300 hover:bg-white/5
                  transition-all duration-200
                  hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
              >
                Logout
              </Button>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
