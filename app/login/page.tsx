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
    else router.push("/dashboard");

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
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
