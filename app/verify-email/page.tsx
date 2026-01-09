// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';

// export default function VerifyEmailPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const token = searchParams.get('token');

//   const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
//   const [message, setMessage] = useState(token ? '' : 'Invalid verification link');

//   useEffect(() => {
//     if (!token) return;

//     const verifyEmail = async () => {
//       try {
//         const response = await fetch('/api/auth/verify-email', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ token }),
//         });

//         const data = await response.json();

//         if (response.ok) {
//           setStatus('success');
//           setMessage(data.message);
//           setTimeout(() => {
//             router.push('/login');
//           }, 3000);
//         } else {
//           setStatus('error');
//           setMessage(data.message);
//         }
//       } catch (error) {
//         setStatus('error');
//         setMessage('Something went wrong. Please try again.');
//       }
//     };

//     verifyEmail();
//   }, [token, router]);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <div className="max-w-md w-full space-y-8">
//         <div className="text-center">
//           <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
//             Email Verification
//           </h2>
//           <div className="mt-8">
//             {status === 'loading' && (
//               <div className="text-center">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
//                 <p className="mt-4 text-gray-600">Verifying your email...</p>
//               </div>
//             )}
//             {status === 'success' && (
//               <div className="text-center">
//                 <div className="text-green-600 text-6xl">✓</div>
//                 <p className="mt-4 text-green-600 font-medium">{message}</p>
//                 <p className="mt-2 text-gray-600">Redirecting to login...</p>
//               </div>
//             )}
//             {status === 'error' && (
//               <div className="text-center">
//                 <div className="text-red-600 text-6xl">✕</div>
//                 <p className="mt-4 text-red-600 font-medium">{message}</p>
//                 <button
//                   onClick={() => router.push('/login')}
//                   className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
//                 >
//                   Go to Login
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

// Component that uses useSearchParams
function VerifyEmailContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <Card className="relative z-10 w-full max-w-md
      bg-white/70 dark:bg-white/5 backdrop-blur-xl
      border border-black/10 dark:border-white/10
      shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
            <p className="text-center text-slate-600 dark:text-slate-400">
              Verifying your email...
            </p>
          </>
        )}
        
        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500" />
            <p className="text-center text-green-600 dark:text-green-400 font-semibold">
              {message}
            </p>
            <Button 
              onClick={() => router.push("/login")}
              className="w-full mt-4"
            >
              Go to Login
            </Button>
          </>
        )}
        
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500" />
            <p className="text-center text-red-600 dark:text-red-400 font-semibold">
              {message}
            </p>
            <Button 
              onClick={() => router.push("/signup")}
              variant="outline"
              className="w-full mt-4"
            >
              Back to Signup
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Main page component with Suspense boundary
export default function VerifyEmailPage() {
  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-6
      bg-slate-100 dark:bg-[#0b1220]">

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br
        from-slate-200 via-white to-blue-100
        dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40" />

      {/* Glowing orbs */}
      <div className="absolute -top-56 -left-56 w-[600px] h-[600px]
        bg-blue-300/40 dark:bg-blue-700/20 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 -right-60 w-[650px] h-[650px]
        bg-indigo-300/35 dark:bg-indigo-800/25 rounded-full blur-[140px]" />

      {/* Suspense wrapper for the content */}
      <Suspense fallback={
        <Card className="relative z-10 w-full max-w-md
          bg-white/70 dark:bg-white/5 backdrop-blur-xl
          border border-black/10 dark:border-white/10
          shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </CardContent>
        </Card>
      }>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}