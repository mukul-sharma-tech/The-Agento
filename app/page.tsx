// "use client";

// import { useSession, signOut } from "next-auth/react";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";

// export default function HomePage() {
//   const { data: session, status } = useSession();
//   const router = useRouter();

//   if (status === "loading") {
//     return (
//       <main className="min-h-screen flex items-center justify-center
//         bg-slate-100 dark:bg-[#0b1220]">
//         <p className="text-slate-500 dark:text-slate-400">Loading...</p>
//       </main>
//     );
//   }

//   return (
//     <main className="
//       relative min-h-screen overflow-hidden
//       flex flex-col items-center justify-center px-6
//       bg-slate-100 dark:bg-[#0b1220]
//     ">

//       {/* BASE GRADIENT */}
//       <div className="
//         absolute inset-0
//         bg-gradient-to-br
//         from-slate-200 via-white to-blue-100
//         dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40
//       " />

//       {/* LARGE SOFT GLOWS */}
//       <div className="
//         absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px]
//         bg-blue-300/40 dark:bg-blue-700/20
//       " />
//       <div className="
//         absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px]
//         bg-indigo-300/35 dark:bg-indigo-800/25
//       " />

//       {/* MID GLOWS */}
//       <div className="
//         absolute bottom-[-200px] left-1/4 w-[520px] h-[520px] rounded-full blur-[110px]
//         bg-cyan-300/30 dark:bg-cyan-700/20
//       " />
//       <div className="
//         absolute top-1/2 left-[-180px] w-[420px] h-[420px] rounded-full blur-[100px]
//         bg-sky-300/35 dark:bg-sky-700/20
//       " />

//       {/* SMALL ACCENT GLOWS */}
//       <div className="
//         absolute top-[20%] right-[20%] w-[260px] h-[260px] rounded-full blur-[80px]
//         bg-indigo-200/40 dark:bg-indigo-600/20
//       " />
//       <div className="
//         absolute bottom-[15%] right-[35%] w-[220px] h-[220px] rounded-full blur-[70px]
//         bg-blue-200/40 dark:bg-blue-600/20
//       " />

//       {/* CONTENT */}
//       <div className="relative z-10 max-w-4xl text-center animate-fade-up">
//         <h1 className="
//           text-4xl md:text-5xl font-semibold tracking-tight
//           text-slate-900 dark:text-slate-100
//         ">
//           Welcome to SynopseeAI
//         </h1>

//         <p className="
//           mt-6 text-lg max-w-xl mx-auto
//           text-slate-600 dark:text-slate-400
//         ">
//           Agentic Market Intelligence & Feasibility Engine
//         </p>

//         <div className="mt-12 flex flex-col sm:flex-row justify-center gap-5">
//           {session ? (
//             <>
//               <Button
//                 onClick={() => router.push("/analyse")}
//                 className="
//                   h-12 px-10
//                   bg-slate-800 text-white
//                   dark:bg-slate-700/60 dark:text-slate-100
//                   border border-black/10 dark:border-white/10
//                   hover:bg-slate-700 dark:hover:bg-slate-700
//                   transition-all duration-200
//                   hover:-translate-y-[1px]
//                   hover:shadow-[0_12px_35px_rgba(59,130,246,0.35)]
//                 "
//               >
//                 Go to Dashboard
//               </Button>

//               <Button
//                 onClick={() => signOut({ callbackUrl: "/" })}
//                 className="
//                   h-12 px-10
//                   bg-transparent
//                   text-slate-700 dark:text-slate-300
//                   border border-black/10 dark:border-white/10
//                   hover:bg-black/5 dark:hover:bg-white/5
//                   transition-all duration-200
//                 "
//               >
//                 Logout
//               </Button>
//             </>
//           ) : (
//             <>
//               <Button
//                 onClick={() => router.push("/login")}
//                 className="
//                   h-12 px-10
//                   bg-slate-800 text-white
//                   dark:bg-slate-700/60 dark:text-slate-100
//                   border border-black/10 dark:border-white/10
//                   hover:bg-slate-700 dark:hover:bg-slate-700
//                   transition-all duration-200
//                   hover:-translate-y-[1px]
//                   hover:shadow-[0_12px_35px_rgba(59,130,246,0.35)]
//                 "
//               >
//                 Login
//               </Button>

//               <Button
//                 onClick={() => router.push("/signup")}
//                 className="
//                   h-12 px-10
//                   bg-transparent
//                   text-slate-700 dark:text-slate-300
//                   border border-black/10 dark:border-white/10
//                   hover:bg-black/5 dark:hover:bg-white/5
//                   transition-all duration-200
//                 "
//               >
//                 Create Account
//               </Button>
//             </>
//           )}
//         </div>
//       </div>
//     </main>
//   );
// }

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
    let timer;
    const checkBackend = async () => {
      try {
        const res = await fetch("http://example.com/"); 
        if (res.status === 200) setIsBackendReady(true);
      } catch (err) {
        timer = setTimeout(checkBackend, 2000);
      }
    };
    checkBackend();
    return () => clearTimeout(timer);
  }, []);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center
        bg-slate-100 dark:bg-[#0b1220]">
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="
      relative min-h-screen overflow-hidden
      flex flex-col items-center justify-center px-6
      bg-slate-100 dark:bg-[#0b1220]
    ">
      <div className={`absolute top-6 right-6 z-50 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all duration-500 
        ${isBackendReady ? 'text-green-600 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}>
        <div className={`w-2 h-2 rounded-full ${isBackendReady ? 'bg-green-600 dark:bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-orange-500 dark:bg-orange-400 animate-pulse'}`} />
        {isBackendReady ? 'System Online' : 'Waking Up Agents...'}
      </div>

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br
        from-slate-200 via-white to-blue-100
        dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40
      " />

      {/* Glow orbs */}
      <div className="absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px]
        bg-blue-300/40 dark:bg-blue-700/20" />
      <div className="absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px]
        bg-indigo-300/35 dark:bg-indigo-800/25" />
      <div className="absolute bottom-[-200px] left-1/4 w-[520px] h-[520px] rounded-full blur-[110px]
        bg-cyan-300/30 dark:bg-cyan-700/20" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl text-center animate-fade-up">

        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight
          text-slate-900 dark:text-slate-100">
          Welcome to Synapsee-AI
        </h1>

        <p className="mt-6 text-lg max-w-xl mx-auto
          text-slate-600 dark:text-slate-400">
          Agentic Market Intelligence & Feasibility Engine
        </p>

        {/* LOGO */}
        <div className="relative mt-14 mb-8 flex justify-center">
          {/* glow behind logo */}
          <div className="absolute inset-0 flex justify-center">
            <div className="w-32 h-32 bg-blue-400/30 dark:bg-blue-600/20
              rounded-full blur-[60px]" />
          </div>

          <Image
            src="/logo.png"
            alt="SynopseeAI Logo"
            width={359}
            height={204}
            className="relative z-10 opacity-90"
            priority
          />
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-5">
          {session ? (
            <>
              <Button
                onClick={() => router.push("/analyse")}
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
