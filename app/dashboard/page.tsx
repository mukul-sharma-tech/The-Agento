"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bot, FileText, LogOut, Mic, Shield } from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0b1220]">
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </main>
    );
  }

  return (
    <main
      className="
      relative min-h-screen overflow-hidden
      flex flex-col items-center justify-center px-6
      bg-slate-100 dark:bg-[#0b1220]
    "
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br
        from-slate-200 via-white to-blue-100
        dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40
      "
      />

      {/* Glow orbs */}
      <div
        className="absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px]
        bg-blue-300/40 dark:bg-blue-700/20"
      />
      <div
        className="absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px]
        bg-indigo-300/35 dark:bg-indigo-800/25"
      />
      <div
        className="absolute bottom-[-200px] left-1/4 w-[520px] h-[520px] rounded-full blur-[110px]
        bg-cyan-300/30 dark:bg-cyan-700/20"
      />

      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full text-center">
            <div className="relative mt-14 mb-8 flex justify-center">
                  {/* glow behind logo */}
                  <div className="absolute inset-0 flex justify-center">
                    <div
                      className="w-32 h-32 bg-blue-400/30 dark:bg-blue-600/20
                      rounded-full blur-[60px]"
                    />
                  </div>
        
                  <Image
                    src="/logo.png"
                    alt="Agento Logo"
                    width={500}
                    height={304}
                    className="relative z-10 opacity-90"
                    priority
                  />
                </div>
        <div className="mb-8">
          <h1
            className="text-4xl md:text-5xl font-semibold tracking-tight
            text-slate-900 dark:text-slate-100"
          >
            Welcome, {session?.user?.name}
          </h1>
          <p
            className="mt-4 text-lg
            text-slate-600 dark:text-slate-400"
          >
            {session?.user?.company_name} ({session?.user?.role})
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-5">
          {/* AI Chat Button - Visible to all */}
          <Button
            onClick={() => router.push("/chat")}
            className="
              h-12 px-10
              bg-slate-800 text-white
              dark:bg-slate-700/60 dark:text-slate-100
              border border-black/10 dark:border-white/10
              hover:bg-slate-700 dark:hover:bg-slate-700
              transition-all duration-200
              hover:-translate-y-[1px]
              hover:shadow-[0_12px_35px_rgba(59,130,246,0.35)]
            "
          >
            <Bot className="w-5 h-5 mr-2" />
            AI Chat
          </Button>

          {/* Voice Call Button - Visible to all */}
          <Button
            onClick={() => router.push("/voice-call")}
            className="
              h-12 px-10
              bg-gradient-to-r from-blue-600 to-purple-600 text-white
              border-0
              hover:from-blue-700 hover:to-purple-700
              transition-all duration-200
              hover:-translate-y-[1px]
              hover:shadow-[0_12px_35px_rgba(139,92,246,0.4)]
            "
          >
            <Mic className="w-5 h-5 mr-2" />
            Voice Call
          </Button>

          {/* Ingest Document Button - Admin only */}
          {session?.user?.role === "admin" && (
            <>
              <Button
                onClick={() => router.push("/admin")}
                className="
                  h-12 px-10
                  bg-gradient-to-r from-green-600 to-emerald-600 text-white
                  border-0
                  hover:from-green-700 hover:to-emerald-700
                  transition-all duration-200
                  hover:-translate-y-[1px]
                  hover:shadow-[0_12px_35px_rgba(34,197,94,0.4)]
                "
              >
                <Shield className="w-5 h-5 mr-2" />
                Admin Panel
              </Button>

              <Button
                onClick={() => router.push("/ingest-doc")}
                className="
                  h-12 px-10
                  bg-slate-800 text-white
                  dark:bg-slate-700/60 dark:text-slate-100
                  border border-black/10 dark:border-white/10
                  hover:bg-slate-700 dark:hover:bg-slate-700
                  transition-all duration-200
                  hover:-translate-y-[1px]
                  hover:shadow-[0_12px_35px_rgba(59,130,246,0.35)]
                "
              >
                <FileText className="w-5 h-5 mr-2" />
                Ingest Document
              </Button>
            </>
          )}

          {/* Logout Button */}
          <Button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="
              h-12 px-10
              bg-transparent
              text-slate-700 dark:text-slate-300
              border border-black/10 dark:border-white/10
              hover:bg-black/5 dark:hover:bg-white/5
              transition-all duration-200
            "
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </main>
  );
}
