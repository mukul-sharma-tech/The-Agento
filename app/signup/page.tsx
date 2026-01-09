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

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || "Something went wrong");
      else router.push("/login");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
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
          <CardTitle className="text-2xl text-center">Signup</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label>Name</Label>
              <Input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
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
            <div>
              <Label>Company Name</Label>
              <Input
                type="text"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                required
              />
            </div>
            <Button className="w-full mt-2" disabled={loading}>
              {loading ? "Signing up..." : "Signup"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer"
              onClick={() => router.push("/login")}
            >
              Login
            </span>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
