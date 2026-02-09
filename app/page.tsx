"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isBackendReady, setIsBackendReady] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined; // Explicitly typed timer

    const checkBackend = async () => {
      try {
        const res = await fetch("http://example.com/");
        if (res.status === 200) {
          setIsBackendReady(true);
          if (timer) {
            clearTimeout(timer);
          }
        }
      } catch (err) {
        // Retry after 2 seconds if backend is not ready
        timer = setTimeout(checkBackend, 2000);
      }
    };

    checkBackend();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

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
      <div
        className={`absolute top-6 right-6 z-50 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all duration-500 
        ${isBackendReady ? "text-green-600 dark:text-green-400" : "text-orange-500 dark:text-orange-400"}`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            isBackendReady
              ? "bg-green-600 dark:bg-green-400 shadow-[0_0_10px_#4ade80]"
              : "bg-orange-500 dark:bg-orange-400 animate-pulse"
          }`}
        />
        {isBackendReady ? "System Online" : "Waking Up Agents..."}
      </div>

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
      <div className="relative z-10 max-w-4xl text-center animate-fade-up">
        <h1
          className="text-4xl md:text-5xl font-semibold tracking-tight
          text-slate-900 dark:text-slate-100"
        >
          Welcome to Agento
        </h1>

        <p
          className="mt-6 text-lg max-w-xl mx-auto
          text-slate-600 dark:text-slate-400"
        >
          Agentic RAG Engine for your company documents
        </p>

        {/* LOGO */}
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

        {/* Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-5">
          {session ? (
            <>
              <Button
                onClick={() => router.push("/dashboard")}
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
                Go to Dashboard
              </Button>

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
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => router.push("/login")}
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
                Login
              </Button>

              <Button
                onClick={() => router.push("/signup")}
                className="
                  h-12 px-10
                  bg-transparent
                  text-slate-700 dark:text-slate-300
                  border border-black/10 dark:border-white/10
                  hover:bg-black/5 dark:hover:bg-white/5
                  transition-all duration-200
                "
              >
                Create Account
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
