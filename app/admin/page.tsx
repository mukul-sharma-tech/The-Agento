"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, Check, X, User, Users, Clock, Shield,
  CreditCard, Bell, Trash2, CheckCircle2, XCircle, Timer, Link, Copy, RefreshCw, ToggleLeft, ToggleRight,
} from "lucide-react";

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

interface SubRequest {
  _id: string;
  userName: string;
  userEmail: string;
  company_name: string;
  plan: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  resolvedAt?: string;
}

interface PublicLinkData {
  _id: string;
  token: string;
  enabled: boolean;
  features: string[];
  guestCallCount: number;
  createdAt: string;
}


type Tab = "employees" | "subscriptions" | "publiclink";
type SubTab = "pending" | "approved" | "rejected";

const PLAN_LABEL: Record<string, string> = {
  "pro-chat": "Pro · AI Chat + Voice",
  "pro-query": "Pro · Query Genius",
  "business": "Business",
};

const PLAN_COLOR: Record<string, string> = {
  "pro-chat": "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
  "pro-query": "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  "business": "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("employees");
  const [subTab, setSubTab] = useState<SubTab>("pending");
  const [empTab, setEmpTab] = useState<"pending" | "verified">("pending");
  const [pendingEmployees, setPendingEmployees] = useState<Employee[]>([]);
  const [verifiedEmployees, setVerifiedEmployees] = useState<Employee[]>([]);
  const [subRequests, setSubRequests] = useState<SubRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [publicLink, setPublicLink] = useState<PublicLinkData | null>(null);
  const [publicLinkLoading, setPublicLinkLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "admin") router.push("/dashboard");
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") fetchAll();
  }, [status, session]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchEmployees(), fetchSubRequests(), fetchPublicLink()]);
    setLoading(false);
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/auth/admin/employees");
      const data = await res.json();
      if (res.ok) {
        setPendingEmployees(data.pendingEmployees || []);
        setVerifiedEmployees(data.verifiedEmployees || []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchSubRequests = async () => {
    try {
      const res = await fetch("/api/auth/admin/subscription-requests");
      const data = await res.json();
      if (res.ok) setSubRequests(data.requests || []);
    } catch (e) { console.error(e); }
  };

  const fetchPublicLink = async () => {
    try {
      const res = await fetch("/api/auth/public-link");
      const data = await res.json();
      if (res.ok) setPublicLink(data.link);
    } catch (e) { console.error(e); }
  };

  const generateLink = async () => {
    setPublicLinkLoading(true);
    try {
      const res = await fetch("/api/auth/public-link", { method: "POST" });
      const data = await res.json();
      if (res.ok) setPublicLink(data.link);
    } catch (e) { console.error(e); }
    finally { setPublicLinkLoading(false); }
  };

  const toggleLink = async () => {
    setPublicLinkLoading(true);
    try {
      const res = await fetch("/api/auth/public-link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle" }),
      });
      const data = await res.json();
      if (res.ok) setPublicLink(data.link);
    } catch (e) { console.error(e); }
    finally { setPublicLinkLoading(false); }
  };

  const regenerateLink = async () => {
    if (!confirm("Regenerate link? The old link will stop working immediately.")) return;
    setPublicLinkLoading(true);
    try {
      const res = await fetch("/api/auth/public-link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate" }),
      });
      const data = await res.json();
      if (res.ok) setPublicLink(data.link);
    } catch (e) { console.error(e); }
    finally { setPublicLinkLoading(false); }
  };

  const deleteLink = async () => {
    if (!confirm("Delete the public link? Anyone using it will lose access.")) return;
    setPublicLinkLoading(true);
    try {
      const res = await fetch("/api/auth/public-link", { method: "DELETE" });
      if (res.ok) setPublicLink(null);
    } catch (e) { console.error(e); }
    finally { setPublicLinkLoading(false); }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmployeeAction = async (employeeId: string, action: "verify" | "reject") => {
    setActionLoading(employeeId);
    try {
      const res = await fetch("/api/auth/admin/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, action }),
      });
      const data = await res.json();
      if (res.ok) fetchEmployees();
      else alert(data.message || "Action failed");
    } catch { alert("Something went wrong"); }
    finally { setActionLoading(null); }
  };

  const handleSubAction = async (requestId: string, action: "approve" | "reject") => {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/auth/admin/subscription-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (res.ok) fetchSubRequests();
      else alert(data.message || "Action failed");
    } catch { alert("Something went wrong"); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/auth/admin/subscription-requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (res.ok) { setSubRequests(prev => prev.filter(r => r._id !== requestId)); }
      else alert(data.message || "Delete failed");
    } catch { alert("Something went wrong"); }
    finally { setActionLoading(null); setConfirmDelete(null); }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0b1220]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session?.user || session.user.role !== "admin") return null;

  const pendingSubs = subRequests.filter(r => r.status === "pending");
  const approvedSubs = subRequests.filter(r => r.status === "approved");
  const rejectedSubs = subRequests.filter(r => r.status === "rejected");
  const visibleSubs = subTab === "pending" ? pendingSubs : subTab === "approved" ? approvedSubs : rejectedSubs;

  const isSuperAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_MAIL;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100 dark:bg-[#0b1220]">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-white to-blue-100 dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40" />
      <div className="absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px] bg-blue-300/40 dark:bg-blue-700/20" />
      <div className="absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px] bg-indigo-300/35 dark:bg-indigo-800/25" />

      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <Shield className="flex-shrink-0 w-8 h-8 text-blue-500" /> <span className="truncate">Admin Dashboard</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage employees and subscriptions
              </p>
            </div>
            <Button onClick={() => router.push("/dashboard")}
              className="w-full md:w-auto h-10 px-6 bg-transparent text-slate-700 dark:text-slate-300 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
              Back to Dashboard
            </Button>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-2 ${isSuperAdmin ? "md:grid-cols-4" : ""} gap-4 mb-8`}>
            {[
              { label: "Pending Employees", value: pendingEmployees.length, icon: <Clock className="h-4 w-4 text-yellow-500" /> },
              { label: "Verified Employees", value: verifiedEmployees.length, icon: <Users className="h-4 w-4 text-green-500" /> },
              ...(isSuperAdmin ? [
                { label: "Pending Subscriptions", value: pendingSubs.length, icon: <Bell className="h-4 w-4 text-orange-500" /> },
                { label: "Active Subscriptions", value: approvedSubs.length, icon: <CreditCard className="h-4 w-4 text-indigo-500" /> }
              ] : [])
            ].map(s => (
              <Card key={s.label} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-black/10 dark:border-white/10 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.label}</CardTitle>
                  {s.icon}
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</div></CardContent>
              </Card>
            ))}
          </div>

          {/* Main tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setTab("employees")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "employees" ? "bg-blue-600 text-white shadow-lg" : "bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-black/10 dark:border-white/10 hover:bg-white/80"}`}>
              <Users className="w-4 h-4" /> Employees
              {pendingEmployees.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold">{pendingEmployees.length}</span>
              )}
            </button>
            {isSuperAdmin && (
              <button onClick={() => setTab("subscriptions")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "subscriptions" ? "bg-indigo-600 text-white shadow-lg" : "bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-black/10 dark:border-white/10 hover:bg-white/80"}`}>
                <CreditCard className="w-4 h-4" /> Subscriptions
                {pendingSubs.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-400 text-orange-900 text-xs font-bold">{pendingSubs.length}</span>
                )}
              </button>
            )}
            <button onClick={() => setTab("publiclink")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "publiclink" ? "bg-emerald-600 text-white shadow-lg" : "bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-black/10 dark:border-white/10 hover:bg-white/80"}`}>
              <Link className="w-4 h-4" /> Public Link
            </button>
          </div>

          {/* ── EMPLOYEES TAB ── */}
          {tab === "employees" && (
            <>
              {/* Employee Sub-tabs */}
              <div className="flex flex-wrap gap-2 mb-5">
                {([
                  { key: "pending", label: "Pending Verification", icon: <Clock className="w-3.5 h-3.5" />, count: pendingEmployees.length, color: "bg-yellow-500" },
                  { key: "verified", label: "Verified Employees", icon: <Check className="w-3.5 h-3.5" />, count: verifiedEmployees.length, color: "bg-green-500" },
                ] as const).map(st => (
                  <button key={st.key} onClick={() => setEmpTab(st.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${empTab === st.key ? `${st.color} text-white shadow` : "bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-black/10 dark:border-white/10 hover:bg-white/80"}`}>
                    {st.icon} {st.label}
                    {st.count > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${empTab === st.key ? "bg-white/30 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
                        {st.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {empTab === "pending" && (
                <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-black/10 dark:border-white/10 shadow-lg mb-6">
                  <CardContent className="pt-6">
                    {pendingEmployees.length === 0 ? (
                      <p className="text-slate-500 text-center py-6">No pending employees</p>
                    ) : (
                      <div className="space-y-3">
                        {pendingEmployees.map(emp => (
                          <div key={emp._id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 p-4 bg-slate-100/50 dark:bg-slate-700/50 rounded-xl border border-black/5 dark:border-white/5">
                            <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
                              <div className="w-9 h-9 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{emp.name}</p>
                                <p className="text-sm text-slate-500 truncate">{emp.email}</p>
                                <p className="text-xs text-slate-400 mt-0.5 truncate">Joined {new Date(emp.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:flex w-full md:w-auto gap-2">
                              <Button onClick={() => handleEmployeeAction(emp._id, "reject")} disabled={actionLoading === emp._id}
                                className="h-9 px-4 w-full md:w-auto bg-transparent text-red-600 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm">
                                <X className="w-3.5 h-3.5 flex-shrink-0 mr-1" /> Reject
                              </Button>
                              <Button onClick={() => handleEmployeeAction(emp._id, "verify")} disabled={actionLoading === emp._id}
                                className="h-9 px-4 w-full md:w-auto bg-green-600 text-white hover:bg-green-700 text-sm">
                                {actionLoading === emp._id ? <Loader2 className="w-3.5 h-3.5 flex-shrink-0 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 flex-shrink-0 mr-1" />}
                                Verify
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {empTab === "verified" && (
                <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-black/10 dark:border-white/10 shadow-lg mb-6">
                  <CardContent className="pt-6">
                    {verifiedEmployees.length === 0 ? (
                      <p className="text-slate-500 text-center py-6">No verified employees yet</p>
                    ) : (
                      <div className="space-y-3">
                        {verifiedEmployees.map(emp => (
                          <div key={emp._id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 p-4 bg-slate-100/50 dark:bg-slate-700/50 rounded-xl border border-black/5 dark:border-white/5">
                            <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
                              <div className="w-9 h-9 flex-shrink-0 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{emp.name}</p>
                                <p className="text-sm text-slate-500 truncate">{emp.email}</p>
                                <p className="text-xs text-slate-400 mt-0.5">Verified {new Date(emp.verifiedAt || emp.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <span className="self-end md:self-auto px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">Verified</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* ── SUBSCRIPTIONS TAB ── */}
          {tab === "subscriptions" && isSuperAdmin && (
            <>
              {/* Sub-tabs */}
              <div className="flex flex-wrap gap-2 mb-5">
                {([
                  { key: "pending", label: "Pending", icon: <Timer className="w-3.5 h-3.5" />, count: pendingSubs.length, color: "bg-orange-500" },
                  { key: "approved", label: "Approved", icon: <CheckCircle2 className="w-3.5 h-3.5" />, count: approvedSubs.length, color: "bg-green-500" },
                  { key: "rejected", label: "Rejected", icon: <XCircle className="w-3.5 h-3.5" />, count: rejectedSubs.length, color: "bg-red-500" },
                ] as const).map(st => (
                  <button key={st.key} onClick={() => setSubTab(st.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${subTab === st.key ? `${st.color} text-white shadow` : "bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-black/10 dark:border-white/10 hover:bg-white/80"}`}>
                    {st.icon} {st.label}
                    {st.count > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${subTab === st.key ? "bg-white/30 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
                        {st.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-black/10 dark:border-white/10 shadow-lg">
                <CardContent className="pt-6">
                  {visibleSubs.length === 0 ? (
                    <p className="text-slate-500 text-center py-10">No {subTab} requests</p>
                  ) : (
                    <div className="space-y-3">
                      {visibleSubs.map(req => (
                        <div key={req._id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 p-4 bg-slate-100/50 dark:bg-slate-700/50 rounded-xl border border-black/5 dark:border-white/5">
                          <div className="flex items-start md:items-center gap-3 w-full md:w-auto overflow-hidden">
                            <div className="w-9 h-9 flex-shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mt-1 md:mt-0">
                              <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{req.userName}</p>
                              <a href={`mailto:${req.userEmail}`} className="text-sm text-indigo-500 hover:underline truncate block">{req.userEmail}</a>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PLAN_COLOR[req.plan] ?? "bg-slate-100 text-slate-600"}`}>
                                  {PLAN_LABEL[req.plan] ?? req.plan}
                                </span>
                                <span className="text-xs text-slate-400">
                                  Requested {new Date(req.requestedAt).toLocaleDateString()}
                                </span>
                                {req.resolvedAt && (
                                  <span className="text-xs text-slate-400">
                                    · Resolved {new Date(req.resolvedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end w-full md:w-auto gap-2">
                            {/* Pending - approve / reject */}
                            {req.status === "pending" && (
                              <div className="grid grid-cols-2 md:flex w-full md:w-auto gap-2">
                                <Button onClick={() => handleSubAction(req._id, "reject")} disabled={!!actionLoading}
                                  className="h-9 px-4 w-full md:w-auto bg-transparent text-red-600 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm">
                                  <X className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> Reject
                                </Button>
                                <Button onClick={() => handleSubAction(req._id, "approve")} disabled={!!actionLoading}
                                  className="h-9 px-4 w-full md:w-auto bg-indigo-600 text-white hover:bg-indigo-700 text-sm">
                                  {actionLoading === req._id ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0 mr-1" /> : <Check className="w-3.5 h-3.5 mr-1 flex-shrink-0" />}
                                  Approve
                                </Button>
                              </div>
                            )}

                            {/* Approved - status badge */}
                            {req.status === "approved" && (
                              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                                Active
                              </span>
                            )}

                            {/* Rejected - status badge */}
                            {req.status === "rejected" && (
                              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold">
                                Rejected
                              </span>
                            )}

                            {/* Delete button - always visible for non-pending */}
                            {req.status !== "pending" && (
                              confirmDelete === req._id ? (
                                <div className="flex gap-1">
                                  <button onClick={() => setConfirmDelete(null)}
                                    className="h-9 px-3 rounded-lg text-xs text-slate-500 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                                    Cancel
                                  </button>
                                  <button onClick={() => handleDelete(req._id)} disabled={!!actionLoading}
                                    className="h-9 px-3 rounded-lg text-xs bg-red-600 text-white hover:bg-red-700 flex items-center gap-1">
                                    {actionLoading === req._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    Confirm
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDelete(req._id)}
                                  className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* ── PUBLIC LINK TAB ── */}
          {tab === "publiclink" && (
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-black/10 dark:border-white/10 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Link className="w-5 h-5 text-emerald-500" /> Shareable Public Link
                </CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Generate a link that lets anyone use your Agento AI chat without signing up. Embed it on your website as an iframe or share it directly.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {!publicLink ? (
                  <div className="flex flex-col items-center gap-4 py-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Link className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">No public link yet</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Generate one to let external users access your AI chat.</p>
                    </div>
                    <Button onClick={generateLink} disabled={publicLinkLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">
                      {publicLinkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link className="w-4 h-4 mr-2" />}
                      Generate Public Link
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Status badge */}
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${publicLink.enabled ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
                        {publicLink.enabled ? "Active" : "Disabled"}
                      </span>
                      <span className="text-xs text-slate-400">{publicLink.guestCallCount} guest calls total</span>
                    </div>

                    {/* Feature toggles */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Exposed Features</p>
                      <div className="flex flex-wrap gap-2">
                        {(["chat", "voice"] as const).map(feat => {
                          const active = publicLink.features?.includes(feat);
                          const toggle = async () => {
                            const current: string[] = publicLink.features || [];
                            const next = active ? current.filter(f => f !== feat) : [...current, feat];
                            if (next.length === 0) return; // must keep at least one
                            setPublicLinkLoading(true);
                            try {
                              const res = await fetch("/api/auth/public-link", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "features", features: next }),
                              });
                              const data = await res.json();
                              if (res.ok) setPublicLink(data.link);
                            } catch (e) { console.error(e); }
                            finally { setPublicLinkLoading(false); }
                          };
                          return (
                            <button key={feat} onClick={toggle} disabled={publicLinkLoading}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${active ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700" : "bg-slate-100 dark:bg-slate-700/50 text-slate-500 border-slate-200 dark:border-slate-600 opacity-60"}`}>
                              {feat === "chat" ? "💬" : "🎙️"} {feat.charAt(0).toUpperCase() + feat.slice(1)}
                              {active ? <CheckCircle2 className="w-3.5 h-3.5 ml-1" /> : <X className="w-3.5 h-3.5 ml-1 opacity-50" />}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Click to toggle. At least one feature must remain active.</p>
                    </div>
                    {(() => {
                      const guestUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/guest/${publicLink.token}`;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-3 bg-slate-100/70 dark:bg-slate-700/50 rounded-xl border border-slate-200/60 dark:border-slate-600/60">
                            <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 font-mono truncate">{guestUrl}</span>
                            <button onClick={() => copyLink(guestUrl)}
                              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                              <Copy className="w-3.5 h-3.5" />
                              {copied ? "Copied!" : "Copy"}
                            </button>
                          </div>

                          {/* Embed snippet */}
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Embed on your website</p>
                            <div className="p-3 bg-slate-900 dark:bg-slate-950 rounded-xl overflow-x-auto">
                              <code className="text-xs text-emerald-400 whitespace-pre">{`<iframe\n  src="${guestUrl}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  allow="microphone"\n></iframe>`}</code>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <Button onClick={toggleLink} disabled={publicLinkLoading}
                        className={`flex items-center gap-2 h-9 px-4 text-sm ${publicLink.enabled ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
                        {publicLinkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : publicLink.enabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {publicLink.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button onClick={regenerateLink} disabled={publicLinkLoading}
                        className="flex items-center gap-2 h-9 px-4 text-sm bg-transparent text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                      </Button>
                      <Button onClick={deleteLink} disabled={publicLinkLoading}
                        className="flex items-center gap-2 h-9 px-4 text-sm bg-transparent text-red-600 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </main>
  );
}
