// "use client";

// import { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";

// export default function ResetPasswordPage() {
//   const [newPassword, setNewPassword] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const token = searchParams.get("token"); // token from query param

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!token) return setMessage("Invalid token");

//     setLoading(true);
//     setMessage("");

//     try {
//       const res = await fetch("/api/auth/reset-password", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token, newPassword }),
//       });

//       const data = await res.json();
//       setMessage(data.message);

//       if (res.ok) {
//         setTimeout(() => router.push("/login"), 2000); // redirect after 2s
//       }
//     } catch {
//       setMessage("Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-6
//       bg-slate-100 dark:bg-[#0b1220]">

//       {/* background */}
//       <div className="absolute inset-0 bg-gradient-to-br
//         from-slate-200 via-white to-blue-100
//         dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40" />

//       <div className="absolute -top-56 -left-56 w-[600px] h-[600px]
//         bg-blue-300/40 dark:bg-blue-700/20 rounded-full blur-[120px]" />
//       <div className="absolute top-1/3 -right-60 w-[650px] h-[650px]
//         bg-indigo-300/35 dark:bg-indigo-800/25 rounded-full blur-[140px]" />

//       {/* card */}
//       <Card className="relative z-10 w-full max-w-md
//         bg-white/70 dark:bg-white/5 backdrop-blur-xl
//         border border-black/10 dark:border-white/10
//         shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
//         <CardHeader>
//           <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {message && <p className="text-green-500 mb-4">{message}</p>}
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <Label>New Password</Label>
//               <Input
//                 type="password"
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//                 required
//               />
//             </div>
//             <Button className="w-full mt-2" disabled={loading}>
//               {loading ? "Resetting..." : "Reset Password"}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </main>
//   );
// }

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Separate component that uses useSearchParams
function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setMessage("Invalid token");

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      setMessage(data.message);

      if (res.ok) {
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="relative z-10 w-full max-w-md
      bg-white/70 dark:bg-white/5 backdrop-blur-xl
      border border-black/10 dark:border-white/10
      shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        {message && <p className="text-green-500 mb-4">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <Button className="w-full mt-2" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Main page component with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-6
      bg-slate-100 dark:bg-[#0b1220]">

      {/* background */}
      <div className="absolute inset-0 bg-gradient-to-br
        from-slate-200 via-white to-blue-100
        dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40" />

      <div className="absolute -top-56 -left-56 w-[600px] h-[600px]
        bg-blue-300/40 dark:bg-blue-700/20 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 -right-60 w-[650px] h-[650px]
        bg-indigo-300/35 dark:bg-indigo-800/25 rounded-full blur-[140px]" />

      {/* Wrap the form in Suspense */}
      <Suspense fallback={
        <Card className="relative z-10 w-full max-w-md
          bg-white/70 dark:bg-white/5 backdrop-blur-xl
          border border-black/10 dark:border-white/10
          shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Loading...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}