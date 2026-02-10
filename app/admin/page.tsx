"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, X, User, Users, Clock, Shield } from "lucide-react";

interface Employee {
  _id: string;
  name: string;
  email: string;
  company_name: string;
  createdAt: string;
  role: string;
  accountVerified: boolean;
  verifiedAt?: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingEmployees, setPendingEmployees] = useState<Employee[]>([]);
  const [verifiedEmployees, setVerifiedEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchEmployees();
    }
  }, [status, session]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/auth/admin/employees");
      const data = await res.json();
      
      if (res.ok) {
        setPendingEmployees(data.pendingEmployees || []);
        setVerifiedEmployees(data.verifiedEmployees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (employeeId: string, action: "verify" | "reject") => {
    setActionLoading(employeeId);
    
    try {
      const res = await fetch("/api/auth/admin/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, action }),
      });

      const data = await res.json();

      if (res.ok) {
        fetchEmployees();
      } else {
        alert(data.message || "Action failed");
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0b1220]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session?.user || session.user.role !== "admin") {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100 dark:bg-[#0b1220]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-white to-blue-100 dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40" />

      {/* Glow orbs */}
      <div className="absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px] bg-blue-300/40 dark:bg-blue-700/20" />
      <div className="absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px] bg-indigo-300/35 dark:bg-indigo-800/25" />
      <div className="absolute bottom-[-200px] left-1/4 w-[520px] h-[520px] rounded-full blur-[110px] bg-cyan-300/30 dark:bg-cyan-700/20" />

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-500" />
                Admin Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage employee verification for {session.user.company_name}
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard")}
              className="
                h-12 px-10
                bg-transparent
                text-slate-700 dark:text-slate-300
                border border-black/10 dark:border-white/10
                hover:bg-black/5 dark:hover:bg-white/5
                transition-all duration-200
              "
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-black/10 dark:border-white/10 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Pending Verification
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {pendingEmployees.length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-black/10 dark:border-white/10 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Verified Employees
                </CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {verifiedEmployees.length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-black/10 dark:border-white/10 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Total Employees
                </CardTitle>
                <User className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {pendingEmployees.length + verifiedEmployees.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Employees */}
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-black/10 dark:border-white/10 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Clock className="w-5 h-5 text-yellow-500" />
                Pending Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingEmployees.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                  No pending employees to verify
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingEmployees.map((employee) => (
                    <div
                      key={employee._id}
                      className="flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-700/50 rounded-lg border border-black/5 dark:border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{employee.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{employee.email}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            Joined: {new Date(employee.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleAction(employee._id, "reject")}
                          disabled={actionLoading === employee._id}
                          className="
                            h-10 px-6
                            bg-transparent
                            text-red-600 dark:text-red-400
                            border border-red-600/30 dark:border-red-400/30
                            hover:bg-red-50 dark:hover:bg-red-900/20
                            transition-all duration-200
                          "
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleAction(employee._id, "verify")}
                          disabled={actionLoading === employee._id}
                          className="
                            h-10 px-6
                            bg-green-600 text-white
                            dark:bg-green-600/80 dark:text-white
                            border border-black/10 dark:border-white/10
                            hover:bg-green-700 dark:hover:bg-green-700
                            transition-all duration-200
                            hover:-translate-y-[1px]
                            hover:shadow-[0_8px_25px_rgba(34,197,94,0.35)]
                          "
                        >
                          {actionLoading === employee._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          Verify
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verified Employees */}
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-black/10 dark:border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Check className="w-5 h-5 text-green-500" />
                Verified Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              {verifiedEmployees.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                  No verified employees yet
                </p>
              ) : (
                <div className="space-y-4">
                  {verifiedEmployees.map((employee) => (
                    <div
                      key={employee._id}
                      className="flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-700/50 rounded-lg border border-black/5 dark:border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{employee.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{employee.email}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            Verified: {new Date(employee.verifiedAt || employee.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                          Verified
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}