"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Clock, Folder, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";

interface Document {
  _id: string;
  filename: string;
  category: string;
  uploaded_by: string;
  upload_date: string;
}

const CATEGORIES = [
  "HR",
  "Engineering",
  "Sales",
  "Marketing",
  "Finance",
  "Legal",
  "Operations",
  "General",
];

export default function IngestDocPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("General");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchDocuments();
    }
  }, [status, session]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents/upload");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setError("");
    setUploadProgress("Reading file...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    try {
      setUploadProgress("Processing document...");
      
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to upload document");
      } else {
        setUploadProgress("Creating vector embeddings...");
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById("file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        
        await fetchDocuments(); // Refresh document list
      }
    } catch {
      setError("Something went wrong while uploading");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-6 bg-slate-100 dark:bg-[#0b1220]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-6 bg-slate-100 dark:bg-[#0b1220]">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-white to-blue-100 dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40" />

      {/* Glow orbs */}
      <div className="absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px] bg-blue-300/40 dark:bg-blue-700/20" />
      <div className="absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px] bg-indigo-300/35 dark:bg-indigo-800/25" />
      <div className="absolute bottom-[-200px] left-1/4 w-[520px] h-[520px] rounded-full blur-[110px] bg-cyan-300/30 dark:bg-cyan-700/20" />

      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Logo */}
      <div className="absolute top-6 z-50">
        <div className="relative">
          <div className="absolute inset-0 flex justify-center">
            <div className="w-20 h-20 bg-blue-400/30 dark:bg-blue-600/20 rounded-full blur-[40px]" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl w-full space-y-8 animate-fade-up mt-20">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Document Ingestion
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Upload documents to create vector embeddings for RAG AI search
          </p>
        </div>

        {/* Upload Card */}
        <Card className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {uploadProgress && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploadProgress}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Select File</Label>
                <Input
                  id="file-input"
                  type="file"
                  accept=".txt,.md,.pdf,.csv,.json"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="mt-1 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Supported formats: TXT, MD, PDF, CSV, JSON
                </p>
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300">Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={uploading}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-slate-50 dark:bg-slate-800/50">
                  <FileText className="w-5 h-5 text-slate-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{file.name}</span>
                  <span className="text-sm text-slate-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}

              <Button
                type="submit"
                disabled={uploading || !file}
                className="w-full h-12 bg-slate-800 text-white dark:bg-slate-700/60 dark:text-slate-100 border border-black/10 dark:border-white/10 hover:bg-slate-700 dark:hover:bg-slate-700 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_35px_rgba(59,130,246,0.35)]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Uploaded Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="mt-4 text-slate-500 dark:text-slate-400">
                  No documents uploaded yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {doc.filename}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {doc.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(doc.upload_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        {doc.uploaded_by}
                      </span>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
