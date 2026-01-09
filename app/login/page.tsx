// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { signIn } from "next-auth/react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";

// export default function LoginPage() {
//   const [form, setForm] = useState({ email: "", password: "" });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//     setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     const res = await signIn("credentials", {
//       redirect: false,
//       email: form.email,
//       password: form.password,
//     });

//     if (res?.error) setError(res.error);
//     else router.push("/dashboard");

//     setLoading(false);
//   };

//   return (
//     <main className="min-h-screen flex items-center justify-center bg-gray-50">
//       <Card className="w-full max-w-md">
//         <CardHeader>
//           <CardTitle className="text-2xl text-center">Login</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {error && <p className="text-red-500 mb-4">{error}</p>}
//           <form className="space-y-4" onSubmit={handleSubmit}>
//             <div>
//               <Label>Email</Label>
//               <Input
//                 type="email"
//                 name="email"
//                 value={form.email}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//             <div>
//               <Label>Password</Label>
//               <Input
//                 type="password"
//                 name="password"
//                 value={form.password}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//             <Button className="w-full mt-2" disabled={loading}>
//               {loading ? "Logging in..." : "Login"}
//             </Button>
//           </form>
//           <p className="mt-4 text-center text-sm">
//             Don&apos;t have an account?{" "}
//             <span
//               className="text-green-600 cursor-pointer"
//               onClick={() => router.push("/signup")}
//             >
//               Signup
//             </span>
//           </p>
//         </CardContent>
//       </Card>
//     </main>
//   );
// }


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    if (res?.error) setError(res.error);
    else router.push("/");

    setLoading(false);
  };

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

      {/* card */}
      <Card className="relative z-10 w-full max-w-md
        bg-white/70 dark:bg-white/5 backdrop-blur-xl
        border border-black/10 dark:border-white/10
        shadow-[0_30px_70px_rgba(0,0,0,0.35)]">

        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <Button className="w-full mt-2" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Forgot Password Link */}
          <p
            className="mt-4 text-center text-blue-600 cursor-pointer hover:underline"
            onClick={() => router.push("/forgot-password")}
          >
            Forgot Password?
          </p>

          <p className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <span
              className="text-green-600 cursor-pointer hover:underline"
              onClick={() => router.push("/signup")}
            >
              Signup
            </span>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
