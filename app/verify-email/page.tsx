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
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";

// Component that uses useSearchParams
function VerifyEmailContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "already">("loading");
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
        } else if (data.message && data.message.includes("already verified")) {
          setStatus("already");
          setMessage(data.message);
        } else if (data.message && data.message.includes("new verification email")) {
          setStatus("already");
          setMessage(data.message);
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
        
        {(status === "error" || status === "already") && (
          <>
            {status === "already" ? (
              <Mail className="w-16 h-16 text-blue-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
            <p className="text-center text-slate-600 dark:text-slate-400 font-medium">
              {message}
            </p>
            {status === "error" && (
              <Button 
                onClick={() => router.push("/signup")}
                variant="outline"
                className="w-full mt-4"
              >
                Back to Signup
              </Button>
            )}
            {status === "already" && (
              <Button 
                onClick={() => router.push("/login")}
                className="w-full mt-4"
              >
                Go to Login
              </Button>
            )}
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
