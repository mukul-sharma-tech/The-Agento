// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";

// export default function ForgotPasswordPage() {
//   const [email, setEmail] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage("");

//     try {
//       const res = await fetch("/api/auth/forgot-password", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       });

//       const data = await res.json();
//       setMessage(data.message);
//     } catch {
//       setMessage("Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="min-h-screen flex items-center justify-center bg-gray-50">
//       <Card className="w-full max-w-md">
//         <CardHeader>
//           <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {message && <p className="text-green-500 mb-4">{message}</p>}
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <Label>Email</Label>
//               <Input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>
//             <Button className="w-full mt-2" disabled={loading}>
//               {loading ? "Sending..." : "Send Reset Link"}
//             </Button>
//           </form>
//           <p
//             className="mt-4 text-center text-sm text-blue-600 cursor-pointer"
//             onClick={() => router.push("/login")}
//           >
//             Back to Login
//           </p>
//         </CardContent>
//       </Card>
//     </main>
//   );
// }



"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      // If token is returned in dev mode, redirect to reset page
      // For demo/testing purposes only
      if (data.token) {
        router.push(`/reset-password?token=${data.token}`);
      } else {
        setMessage(data.message || "Check your email for reset link");
      }
    } catch (error) {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          {message && <p className="text-green-500 mb-4">{message}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button className="w-full mt-2" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
