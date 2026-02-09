"use client";

import { useState, useEffect } from "react";
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

interface Company {
  _id: string;
  company_id: string;
  company_name: string;
}

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company_id: "",
    company_name: "",
    role: "employee",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/auth/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-populate company_name when employee selects a company
    if (name === "company_id" && form.role === "employee") {
      const selectedCompany = companies.find(c => c.company_id === value);
      setForm({
        ...form,
        company_id: value,
        company_name: selectedCompany?.company_name || "",
      });
      return;
    }
    
    setForm({ ...form, [name]: value });
  };

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
      if (!res.ok) {
        setError(data.message || "Something went wrong");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-6
        bg-slate-100 dark:bg-[#0b1220]">
        <div className="absolute inset-0 bg-gradient-to-br
          from-slate-200 via-white to-blue-100
          dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40" />
        <div className="absolute -top-56 -left-56 w-[600px] h-[600px]
          bg-blue-300/40 dark:bg-blue-700/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-60 w-[650px] h-[650px]
          bg-indigo-300/35 dark:bg-indigo-800/25 rounded-full blur-[140px]" />

        <Card className="relative z-10 w-full max-w-md
          bg-white/70 dark:bg-white/5 backdrop-blur-xl
          border border-black/10 dark:border-white/10
          shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-green-600">Email Sent!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              We&apos;ve sent a verification email to <strong>{form.email}</strong>
            </p>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Please check your email and click the verification link to activate your account.
            </p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

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
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div>
              <Label>Role</Label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Employee: Show company dropdown */}
            {form.role === "employee" && (
              <div>
                <Label>Company</Label>
                <select
                  name="company_id"
                  value={form.company_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
                  required
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company.company_id}>
                      {company.company_name} ({company.company_id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Admin: Show company creation fields */}
            {form.role === "admin" && (
              <>
                <div>
                  <Label>Company ID</Label>
                  <Input
                    type="text"
                    name="company_id"
                    value={form.company_id}
                    onChange={handleChange}
                    placeholder="e.g., ABC_X7Y9"
                    required
                  />
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Input
                    type="text"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

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
