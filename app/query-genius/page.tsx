"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Upload, Database, Search, Trash2, Loader2,
  Table, ChevronDown, ChevronUp, FileSpreadsheet, Zap,
  CheckCircle, PlusCircle, RefreshCw, AlertCircle, Settings,
  HardDriveUpload, Cpu, BarChart2, Microscope, TrendingUp, Lightbulb,
} from "lucide-react";
import Image from "next/image";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Collection { name: string; count: number; fields: string[] }
interface FieldConstraint {
  type: string; nullable: boolean; unique: boolean;
  isAutoIncrement: boolean; isPrimaryKey: boolean;
  min?: number; max?: number; enumValues?: unknown[];
  currentMax?: number; sampleValues: unknown[];
}
interface QueryResult {
  operation: "read" | "insert" | "update" | "delete";
  pipeline?: object[]; filter?: object; update?: object;
  document?: Record<string, unknown>; results: Record<string, unknown>[];
  count: number; message?: string;
  matchedCount?: number; modifiedCount?: number; deletedCount?: number;
  validationErrors?: string[];
}
interface AnalyticsResult {
  type: string; pipeline?: object[];
  results: Record<string, unknown>[]; insight: string; count: number;
  chartType?: string;
}
interface SchemaFieldDef {
  name: string; type: "string" | "number" | "boolean";
  primaryKey: boolean; unique: boolean; nullable: boolean;
  autoIncrement: boolean; enumValues: string;
}

type Tab = "read" | "insert" | "update" | "delete";
type AnalyticsTab = "descriptive" | "diagnostic" | "predictive" | "prescriptive";
type SidebarMode = "ingest" | "work" | "analytics";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "read",   label: "Read",   icon: <Search className="w-3.5 h-3.5" /> },
  { id: "insert", label: "Insert", icon: <PlusCircle className="w-3.5 h-3.5" /> },
  { id: "update", label: "Update", icon: <RefreshCw className="w-3.5 h-3.5" /> },
  { id: "delete", label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" /> },
];

const ANALYTICS_TABS: { id: AnalyticsTab; label: string; question: string; color: string; icon: React.ReactNode; placeholder: string }[] = [
  { id: "descriptive",  label: "Descriptive",  question: "What happened?",     color: "blue",   icon: <BarChart2 className="w-3.5 h-3.5" />,  placeholder: 'e.g. "Summarize sales by region"' },
  { id: "diagnostic",   label: "Diagnostic",   question: "Why did it happen?", color: "purple", icon: <Microscope className="w-3.5 h-3.5" />, placeholder: 'e.g. "Why did revenue drop last month?"' },
  { id: "predictive",   label: "Predictive",   question: "What might happen?", color: "amber",  icon: <TrendingUp className="w-3.5 h-3.5" />, placeholder: 'e.g. "Forecast next quarter performance"' },
  { id: "prescriptive", label: "Prescriptive", question: "What should we do?", color: "green",  icon: <Lightbulb className="w-3.5 h-3.5" />,  placeholder: 'e.g. "What actions to improve sales?"' },
];

// ── AnalyticsChart ────────────────────────────────────────────────────────────
const CHART_COLORS = ["#6366f1","#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"];

const TOOLTIP_STYLE = {
  background: "rgba(255,255,255,0.95)",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  color: "#1e293b",
  fontSize: 12,
};
const AXIS_TICK = { fill: "#64748b", fontSize: 11 };
const GRID_COLOR = "#e2e8f0";

function flattenDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (v === null || v === undefined) { out[k] = null; continue; }
    if (Array.isArray(v)) { out[k] = v.length; continue; } // array → count
    if (typeof v === "object") {
      // nested object → try common keys, else stringify label
      const obj = v as Record<string, unknown>;
      if ("count" in obj) { out[k] = Number(obj.count); continue; }
      if ("total" in obj) { out[k] = Number(obj.total); continue; }
      if ("avg" in obj)   { out[k] = Number(obj.avg);   continue; }
      // $bucket _id range like { min: 0, max: 10 }
      const vals = Object.values(obj);
      if (vals.length === 2 && vals.every(x => typeof x === "number")) {
        out[k] = `${vals[0]}-${vals[1]}`; continue;
      }
      out[k] = JSON.stringify(v); // last resort
    } else {
      out[k] = v;
    }
  }
  return out;
}

function AnalyticsChart({ data, chartType }: { data: Record<string, unknown>[]; chartType: string }) {
  if (!data.length) return null;

  // Flatten nested objects first
  const flat = data.map(flattenDoc);

  const keys = Object.keys(flat[0]);
  // Label key: prefer "label" (from _id unwrap), then first string that isn't purely numeric
  const labelKey =
    keys.includes("label") ? "label" :
    keys.find(k => typeof flat[0][k] === "string" && isNaN(Number(flat[0][k]))) ||
    keys[0];
  // Value keys: numeric, excluding label
  const valueKeys = keys.filter(k => k !== labelKey && flat[0][k] !== null && !isNaN(Number(flat[0][k])));
  const finalValueKeys = valueKeys.length > 0 ? valueKeys : keys.filter(k => k !== labelKey);

  const formatted = flat.map(row => {
    const out: Record<string, unknown> = { name: String(row[labelKey] ?? "") };
    finalValueKeys.forEach(k => { out[k] = isNaN(Number(row[k])) ? 0 : Number(row[k]); });
    return out;
  });

  if (!finalValueKeys.length) return null;

  // Line/area charts need ≥2 points to be meaningful
  const effectiveChartType =
    (chartType === "line" || chartType === "area") && formatted.length < 2 ? "bar" : chartType;
  const insufficientNote = effectiveChartType !== chartType
    ? `(switched to bar — line/area needs ≥2 data points, got ${formatted.length})`
    : null;

  const commonProps = { data: formatted, margin: { top: 10, right: 20, left: 0, bottom: 50 } };

  if (effectiveChartType === "pie") {
    const pieData = formatted.map((d, i) => ({ name: d.name as string, value: d[finalValueKeys[0]] as number, fill: CHART_COLORS[i % CHART_COLORS.length] }));
    return (
      <>
        {insufficientNote && <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 italic">{insufficientNote}</p>}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: "#94a3b8" }}>
              {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Pie>
            <Tooltip formatter={(v) => Number(v).toLocaleString()} contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: "#64748b", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </>
    );
  }

  if (effectiveChartType === "line") {
    return (
      <>
        {insufficientNote && <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 italic">{insufficientNote}</p>}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="name" tick={AXIS_TICK} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} angle={-30} textAnchor="end" />
            <YAxis tick={AXIS_TICK} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: "#64748b", fontSize: 12 }} />
            {finalValueKeys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[i % CHART_COLORS.length] }} />)}
          </LineChart>
        </ResponsiveContainer>
      </>
    );
  }

  if (effectiveChartType === "area") {
    return (
      <>
        {insufficientNote && <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 italic">{insufficientNote}</p>}
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart {...commonProps}>
            <defs>{finalValueKeys.map((k, i) => (
              <linearGradient key={k} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.25} />
                <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}</defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="name" tick={AXIS_TICK} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} angle={-30} textAnchor="end" />
            <YAxis tick={AXIS_TICK} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: "#64748b", fontSize: 12 }} />
            {finalValueKeys.map((k, i) => <Area key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={`url(#grad${i})`} strokeWidth={2} />)}
          </AreaChart>
        </ResponsiveContainer>
      </>
    );
  }

  // default: bar
  return (
    <>
      {insufficientNote && <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 italic">{insufficientNote}</p>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="name" tick={AXIS_TICK} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} angle={-30} textAnchor="end" />
          <YAxis tick={AXIS_TICK} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
          <Legend wrapperStyle={{ color: "#64748b", fontSize: 12 }} />
          {finalValueKeys.map((k, i) => <Bar key={k} dataKey={k} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

// ── InsertTab (append rows to existing collection) ────────────────────────────
function InsertTab({ collectionName, schema, schemaLoading, onSuccess }: {
  collectionName: string;
  schema: Record<string, FieldConstraint>;
  schemaLoading: boolean;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    inserted: number; rejected: number;
    rejectedDetails?: { row: number; values: Record<string, string>; errors: string[] }[];
    message: string;
  } | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);

  const parsePreview = async (f: File) => {
    const text = await f.text();
    const lines = text.split("\n").filter(l => l.trim()).slice(0, 6);
    if (lines.length < 2) return;
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, "").replace(/\s+/g, "_").toLowerCase());
    const rows = lines.slice(1, 4).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
      const row: Record<string, unknown> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
      return row;
    });
    setPreview(rows);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f); setResult(null); setPreview([]);
    if (f) parsePreview(f);
  };

  const handleAppend = async () => {
    if (!file) return;
    setUploading(true); setResult(null);
    const fd = new FormData();
    fd.append("file", file); fd.append("collectionName", collectionName); fd.append("mode", "append");
    try {
      const res = await fetch("/api/query-genius/upload", { method: "POST", body: fd });
      const d = await res.json();
      setResult({ inserted: d.inserted ?? 0, rejected: d.rejected ?? 0, rejectedDetails: d.rejectedDetails, message: d.message });
      if (res.ok && d.inserted > 0) {
        setFile(null); setPreview([]);
        const el = document.getElementById("insert-file") as HTMLInputElement;
        if (el) el.value = "";
        onSuccess();
      }
    } catch { setResult({ inserted: 0, rejected: 0, message: "Something went wrong" }); }
    finally { setUploading(false); }
  };

  const schemaFields = Object.keys(schema);
  const previewCols = preview.length ? Object.keys(preview[0]) : [];

  return (
    <div className="space-y-4">
      {!schemaLoading && schemaFields.length > 0 && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Expected columns:</p>
          <div className="flex flex-wrap gap-2">
            {schemaFields.map(f => (
              <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                {f} <span className="opacity-60">({schema[f].type})</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <label htmlFor="insert-file" className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${file ? "border-green-400 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10" : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/30"}`}>
        <Upload className={`w-8 h-8 ${file ? "text-green-500" : "text-slate-400"}`} />
        {file ? (
          <div className="text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">{file.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB · click to change</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drop a CSV or Excel file here</p>
            <p className="text-xs text-slate-500 mt-0.5">or click to browse</p>
          </div>
        )}
        <input id="insert-file" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
      </label>
      {preview.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Preview (first 3 rows):</p>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-xs">
              <thead><tr className="bg-slate-100 dark:bg-slate-800">
                {previewCols.map(c => <th key={c} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap border-b border-slate-200 dark:border-slate-700">{c}</th>)}
              </tr></thead>
              <tbody>{preview.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-slate-900/50" : "bg-slate-50/50 dark:bg-slate-800/30"}>
                  {previewCols.map(c => <td key={c} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap border-b border-slate-100 dark:border-slate-800">{String(row[c] ?? "")}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
      {result && (
        <div className="space-y-2">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${result.rejected > 0 && result.inserted === 0 ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400" : result.rejected > 0 ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400" : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"}`}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" /><span>{result.message}</span>
          </div>
          {result.rejectedDetails && result.rejectedDetails.length > 0 && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 overflow-hidden">
              <div className="bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-400">Rejected rows ({result.rejected})</div>
              <div className="divide-y divide-red-100 dark:divide-red-900/30 max-h-48 overflow-y-auto">
                {result.rejectedDetails.map((r, i) => (
                  <div key={i} className="px-3 py-2 text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Row {r.row}:</span>
                    <span className="ml-2 text-slate-500">{Object.values(r.values).join(", ")}</span>
                    <ul className="mt-1 space-y-0.5">{r.errors.map((e, j) => <li key={j} className="text-red-600 dark:text-red-400">• {e}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <Button onClick={handleAppend} disabled={!file || uploading} className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><PlusCircle className="w-4 h-4 mr-2" />Append to {collectionName}</>}
      </Button>
    </div>
  );
}

// ── SchemaBuilder ─────────────────────────────────────────────────────────────
function SchemaBuilder({ fields, onChange }: {
  fields: SchemaFieldDef[];
  onChange: (fields: SchemaFieldDef[]) => void;
}) {
  const update = (i: number, patch: Partial<SchemaFieldDef>) =>
    onChange(fields.map((f, idx) => idx === i ? { ...f, ...patch } : f));

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
        <Settings className="w-3.5 h-3.5" /> Define schema for each column
      </p>
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <th className="px-3 py-2 text-left font-semibold border-b border-slate-200 dark:border-slate-700 min-w-[90px]">Field</th>
                <th className="px-3 py-2 text-left font-semibold border-b border-slate-200 dark:border-slate-700">Type</th>
                <th className="px-3 py-2 text-center font-semibold border-b border-slate-200 dark:border-slate-700">PK</th>
                <th className="px-3 py-2 text-center font-semibold border-b border-slate-200 dark:border-slate-700">Unique</th>
                <th className="px-3 py-2 text-center font-semibold border-b border-slate-200 dark:border-slate-700">Null</th>
                <th className="px-3 py-2 text-center font-semibold border-b border-slate-200 dark:border-slate-700">Auto++</th>
                <th className="px-3 py-2 text-left font-semibold border-b border-slate-200 dark:border-slate-700 min-w-[120px]">Enum (comma-sep)</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, i) => (
                <tr key={f.name} className={i % 2 === 0 ? "bg-white dark:bg-slate-900/50" : "bg-slate-50/50 dark:bg-slate-800/30"}>
                  <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">{f.name}</td>
                  <td className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <select value={f.type} onChange={e => update(i, { type: e.target.value as SchemaFieldDef["type"], autoIncrement: e.target.value !== "number" ? false : f.autoIncrement })}
                      className="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400">
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center border-b border-slate-100 dark:border-slate-800">
                    <input type="checkbox" checked={f.primaryKey} onChange={e => update(i, { primaryKey: e.target.checked, unique: e.target.checked ? true : f.unique })} className="accent-indigo-500 w-3.5 h-3.5" />
                  </td>
                  <td className="px-3 py-2 text-center border-b border-slate-100 dark:border-slate-800">
                    <input type="checkbox" checked={f.unique || f.primaryKey} disabled={f.primaryKey} onChange={e => update(i, { unique: e.target.checked })} className="accent-indigo-500 w-3.5 h-3.5" />
                  </td>
                  <td className="px-3 py-2 text-center border-b border-slate-100 dark:border-slate-800">
                    <input type="checkbox" checked={f.nullable} onChange={e => update(i, { nullable: e.target.checked })} className="accent-indigo-500 w-3.5 h-3.5" />
                  </td>
                  <td className="px-3 py-2 text-center border-b border-slate-100 dark:border-slate-800">
                    <input type="checkbox" checked={f.autoIncrement} disabled={f.type !== "number"} onChange={e => update(i, { autoIncrement: e.target.checked })} className="accent-indigo-500 w-3.5 h-3.5 disabled:opacity-40" />
                  </td>
                  <td className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <input type="text" value={f.enumValues} placeholder="e.g. A,B,C" onChange={e => update(i, { enumValues: e.target.value })}
                      className="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">PK = Primary Key · Auto++ = Auto-increment (number only)</p>
    </div>
  );
}

function buildSchemaFromFields(fields: SchemaFieldDef[]) {
  const schema: Record<string, { type: string; primaryKey?: boolean; unique?: boolean; nullable?: boolean; autoIncrement?: boolean; enumValues?: string[] }> = {};
  for (const f of fields) {
    schema[f.name] = {
      type: f.type,
      ...(f.primaryKey && { primaryKey: true }),
      ...(f.unique && { unique: true }),
      ...(f.nullable && { nullable: true }),
      ...(f.autoIncrement && { autoIncrement: true }),
      ...(f.enumValues.trim() && { enumValues: f.enumValues.split(",").map(v => v.trim()).filter(Boolean) }),
    };
  }
  return schema;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function QueryGeniusPage() {
  const { status } = useSession();
  const router = useRouter();

  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("ingest");

  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [schema, setSchema] = useState<Record<string, FieldConstraint>>({});
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("read");

  // Upload / ingestion state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadStep, setUploadStep] = useState<"form" | "schema">("form");
  const [schemaFields, setSchemaFields] = useState<SchemaFieldDef[]>([]);

  // Query state
  const [nlQuery, setNlQuery] = useState("");
  const [querying, setQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState("");
  const [showPipeline, setShowPipeline] = useState(false);

  const [deletingCol, setDeletingCol] = useState<string | null>(null);

  // Analytics state
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>("descriptive");
  const [analyticsQuery, setAnalyticsQuery] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsResult, setAnalyticsResult] = useState<AnalyticsResult | null>(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [showAnalyticsPipeline, setShowAnalyticsPipeline] = useState(false);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  const fetchCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const res = await fetch("/api/query-genius/collections");
      if (res.ok) { const d = await res.json(); setCollections(d.collections || []); }
    } finally { setCollectionsLoading(false); }
  }, []);

  useEffect(() => { if (status === "authenticated") fetchCollections(); }, [status, fetchCollections]);

  const fetchSchema = useCallback(async (name: string) => {
    setSchemaLoading(true); setSchema({});
    try {
      const res = await fetch(`/api/query-genius/schema?collection=${name}`);
      if (res.ok) { const d = await res.json(); setSchema(d.schema || {}); }
    } finally { setSchemaLoading(false); }
  }, []);

  const selectCollection = (name: string) => {
    setSelectedCollection(name);
    setQueryResult(null); setQueryError(""); setNlQuery("");
    fetchSchema(name);
  };

  const parseHeaders = async (f: File): Promise<string[]> =>
    f.text().then(t => t.split("\n")[0].split(",").map(h => h.trim().replace(/"/g, "").replace(/\s+/g, "_").toLowerCase()).filter(Boolean));

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setUploadFile(f); setUploadMsg(null);
    if (f) {
      const headers = await parseHeaders(f);
      setSchemaFields(headers.map(h => ({ name: h, type: "string", primaryKey: false, unique: false, nullable: false, autoIncrement: false, enumValues: "" })));
    }
  };

  const handleProceedToSchema = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadName.trim()) return;
    setUploadStep("schema");
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) return;
    setUploading(true); setUploadMsg(null);
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("collectionName", uploadName.trim().replace(/\s+/g, "_").toLowerCase());
    fd.append("mode", "replace");
    fd.append("schema", JSON.stringify(buildSchemaFromFields(schemaFields)));
    try {
      const res = await fetch("/api/query-genius/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (res.ok) {
        const msg = d.rejected > 0 ? `Uploaded ${d.inserted} rows (${d.rejected} rejected) to "${uploadName}"` : `Uploaded ${d.inserted} rows to "${uploadName}"`;
        setUploadMsg({ type: d.inserted > 0 ? "success" : "error", text: msg });
        if (d.inserted > 0) {
          setUploadFile(null); setUploadName(""); setUploadStep("form"); setSchemaFields([]);
          const el = document.getElementById("qg-file") as HTMLInputElement;
          if (el) el.value = "";
          fetchCollections();
        }
      } else { setUploadMsg({ type: "error", text: d.message || "Upload failed" }); }
    } catch { setUploadMsg({ type: "error", text: "Something went wrong" }); }
    finally { setUploading(false); }
  };

  const submitQuery = async (operation: Tab, extra?: Record<string, unknown>) => {
    setQuerying(true); setQueryError(""); setQueryResult(null); setShowPipeline(false);
    try {
      const body: Record<string, unknown> = { operation, collectionName: selectedCollection, ...extra };
      const res = await fetch("/api/query-genius/query", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (res.ok || res.status === 422) {
        setQueryResult({ ...d, results: d.results ?? [] });
        if (res.ok && ["insert", "delete"].includes(operation)) fetchCollections();
      } else { setQueryError(d.message || "Operation failed"); }
    } catch { setQueryError("Something went wrong"); }
    finally { setQuerying(false); }
  };

  const submitAnalytics = async () => {
    if (!analyticsQuery.trim() || !selectedCollection) return;
    setAnalyticsLoading(true); setAnalyticsError(""); setAnalyticsResult(null); setShowAnalyticsPipeline(false);
    try {
      const res = await fetch("/api/query-genius/analytics", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: analyticsTab, collectionName: selectedCollection, query: analyticsQuery }),
      });
      const d = await res.json();
      if (res.ok) setAnalyticsResult(d);
      else setAnalyticsError(d.message || "Analytics failed");
    } catch { setAnalyticsError("Something went wrong"); }
    finally { setAnalyticsLoading(false); }
  };

  const handleDeleteCollection = async (name: string) => {    if (!confirm(`Delete collection "${name}"?`)) return;
    setDeletingCol(name);
    try {
      const res = await fetch(`/api/query-genius/data?collection=${name}`, { method: "DELETE" });
      if (res.ok) { if (selectedCollection === name) setSelectedCollection(""); fetchCollections(); }
    } finally { setDeletingCol(null); }
  };

  if (status === "loading") return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0b1220]">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </main>
  );

  const tableColumns = queryResult?.results?.length ? Object.keys(queryResult.results[0]) : [];

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100 dark:bg-[#0b1220] flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-white to-blue-100 dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40 pointer-events-none" />
      <div className="absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px] bg-blue-300/40 dark:bg-blue-700/20 pointer-events-none" />
      <div className="absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px] bg-indigo-300/35 dark:bg-indigo-800/25 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm flex-shrink-0">
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-500" />
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Query Genius</h1>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex justify-center"><div className="w-10 h-10 bg-blue-400/20 rounded-full blur-[20px]" /></div>
          <Image src="/logo.png" alt="Logo" width={100} height={57} className="relative z-10 opacity-80" />
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ── SIDEBAR: toggle + collections only ── */}
        <aside className="w-64 flex-shrink-0 flex flex-col border-r border-slate-200/60 dark:border-slate-700/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl overflow-y-auto">

          {/* Mode toggle */}
          <div className="p-3 border-b border-slate-200/60 dark:border-slate-700/60">
            <div className="flex flex-col gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/60 p-1">
              <div className="flex gap-1">
                <button
                  onClick={() => setSidebarMode("ingest")}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${sidebarMode === "ingest" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
                >
                  <HardDriveUpload className="w-4 h-4" />
                  <span>Data Ingestion</span>
                </button>
                <button
                  onClick={() => setSidebarMode("work")}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${sidebarMode === "work" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
                >
                  <Cpu className="w-4 h-4" />
                  <span>Work on Data</span>
                </button>
              </div>
              <button
                onClick={() => setSidebarMode("analytics")}
                className={`w-full flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${sidebarMode === "analytics" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Analytics</span>
              </button>
            </div>
          </div>

          {/* Collections list */}
          <div className="flex-1 p-3 space-y-1.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Collections
              </p>
              {collectionsLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
            </div>

            {!collectionsLoading && collections.length === 0 && (
              <div className="text-center py-8">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">No collections yet</p>
                {sidebarMode === "work" && (
                  <button onClick={() => setSidebarMode("ingest")} className="mt-1.5 text-xs text-indigo-500 hover:underline">Upload one →</button>
                )}
              </div>
            )}

            {collections.map(col => (
              <div key={col.name}
                onClick={() => { selectCollection(col.name); if (sidebarMode === "ingest") setSidebarMode("work"); }}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer border transition-all ${selectedCollection === col.name && sidebarMode === "work" ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700" : "bg-white/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{col.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{col.count.toLocaleString()} rows</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteCollection(col.name); }}
                  disabled={deletingCol === col.name}
                  className="ml-1 p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0">
                  {deletingCol === col.name ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ════ DATA INGESTION VIEW ════ */}
          {sidebarMode === "ingest" && (
            <div className="max-w-2xl mx-auto space-y-5">
              <Card className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HardDriveUpload className="w-4 h-4 text-indigo-500" />
                    Data Ingestion
                    {uploadStep === "schema" && (
                      <span className="ml-auto text-xs font-normal text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                        <Settings className="w-3 h-3" /> Step 2: Define Schema
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {uploadStep === "form" ? (
                    <form onSubmit={handleProceedToSchema} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-slate-700 dark:text-slate-300">Collection name</Label>
                        <Input placeholder="e.g. students, products, orders" value={uploadName}
                          onChange={e => setUploadName(e.target.value)} disabled={uploading}
                          className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-700 dark:text-slate-300">CSV file</Label>
                        <label htmlFor="qg-file" className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${uploadFile ? "border-green-400 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10" : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/30"}`}>
                          <Upload className={`w-8 h-8 ${uploadFile ? "text-green-500" : "text-slate-400"}`} />
                          {uploadFile ? (
                            <div className="text-center">
                              <p className="text-sm font-medium text-green-700 dark:text-green-400">{uploadFile.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{(uploadFile.size / 1024).toFixed(1)} KB · click to change</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drop a CSV file here</p>
                              <p className="text-xs text-slate-500 mt-0.5">or click to browse</p>
                            </div>
                          )}
                          <input id="qg-file" type="file" accept=".csv" disabled={uploading} onChange={handleFileSelect} className="hidden" />
                        </label>
                      </div>
                      {uploadMsg && <p className={`text-sm ${uploadMsg.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{uploadMsg.text}</p>}
                      <Button type="submit" disabled={uploading || !uploadFile || !uploadName.trim()}
                        className="w-full h-10 bg-slate-800 text-white dark:bg-slate-700/60 dark:text-slate-100 border border-black/10 dark:border-white/10 hover:bg-slate-700">
                        <Settings className="w-4 h-4 mr-2" />Next: Define Schema
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-200 dark:border-slate-700">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{uploadFile?.name}</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{uploadName}</span>
                      </div>
                      <SchemaBuilder fields={schemaFields} onChange={setSchemaFields} />
                      {uploadMsg && <p className={`text-sm ${uploadMsg.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{uploadMsg.text}</p>}
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => { setUploadStep("form"); setUploadMsg(null); }} disabled={uploading}
                          className="flex-1 h-10 border-slate-200 dark:border-slate-700">← Back</Button>
                        <Button type="button" onClick={handleUpload} disabled={uploading || schemaFields.length === 0}
                          className="flex-1 h-10 bg-slate-800 text-white dark:bg-slate-700/60 dark:text-slate-100 border border-black/10 dark:border-white/10 hover:bg-slate-700">
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" />Upload Collection</>}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════ WORK ON DATA VIEW ════ */}
          {sidebarMode === "work" && (
            <>
              {!selectedCollection ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                  <Cpu className="w-14 h-14 text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Select a collection from the sidebar</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Then use the tabs to read, insert, update, or delete data.</p>
                </div>
              ) : (
                <Card className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <CardTitle className="text-base text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                        {selectedCollection}
                        {schemaLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                      </CardTitle>
                    </div>
                    <div className="flex gap-1 mt-3 border-b border-slate-200 dark:border-slate-700">
                      {TABS.map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id); setQueryResult(null); setQueryError(""); }}
                          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${activeTab === t.id ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
                          {t.icon}{t.label}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5">
                    {activeTab === "read" && (
                      <form onSubmit={e => { e.preventDefault(); submitQuery("read", { query: nlQuery }); }} className="space-y-3">
                        <Label className="text-slate-700 dark:text-slate-300">Ask a question about your data</Label>
                        <div className="flex gap-2">
                          <Input placeholder='e.g. "Show students with marks above 80"' value={nlQuery} onChange={e => setNlQuery(e.target.value)} disabled={querying} className="flex-1 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" />
                          <Button type="submit" disabled={querying || !nlQuery.trim()} className="h-10 px-5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-0 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50">
                            {querying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          </Button>
                        </div>
                      </form>
                    )}
                    {activeTab === "insert" && (
                      <InsertTab collectionName={selectedCollection} schema={schema} schemaLoading={schemaLoading}
                        onSuccess={() => { fetchCollections(); fetchSchema(selectedCollection); }} />
                    )}
                    {activeTab === "update" && (
                      <form onSubmit={e => { e.preventDefault(); submitQuery("update", { query: nlQuery }); }} className="space-y-3">
                        <Label className="text-slate-700 dark:text-slate-300">Describe what to update</Label>
                        <Input placeholder='e.g. "Set grade to A for students with marks above 90"' value={nlQuery} onChange={e => setNlQuery(e.target.value)} disabled={querying} className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" />
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">Available fields:</p>
                          {Object.entries(schema).map(([f, c]) => (
                            <span key={f} className="inline-block mr-3">{f} <span className="text-slate-400">({c.type}{c.enumValues ? ` · ${(c.enumValues as string[]).join("/")}` : ""})</span></span>
                          ))}
                        </div>
                        <Button type="submit" disabled={querying || !nlQuery.trim()} className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50">
                          {querying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 mr-2" />Update Records</>}
                        </Button>
                      </form>
                    )}
                    {activeTab === "delete" && (
                      <form onSubmit={e => { e.preventDefault(); submitQuery("delete", { query: nlQuery }); }} className="space-y-3">
                        <Label className="text-slate-700 dark:text-slate-300">Describe which records to delete</Label>
                        <Input placeholder='e.g. "Delete students with grade F"' value={nlQuery} onChange={e => setNlQuery(e.target.value)} disabled={querying} className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" />
                        <Button type="submit" disabled={querying || !nlQuery.trim()} className="w-full h-10 bg-gradient-to-r from-red-600 to-rose-600 text-white border-0 hover:from-red-700 hover:to-rose-700 disabled:opacity-50">
                          {querying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-2" />Delete Records</>}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )}

              {queryError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{queryError}
                </div>
              )}

              {queryResult && (
                <Card className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {queryResult.operation === "read"   && <Table className="w-4 h-4" />}
                        {queryResult.operation === "insert" && <PlusCircle className="w-4 h-4 text-green-500" />}
                        {queryResult.operation === "update" && <RefreshCw className="w-4 h-4 text-blue-500" />}
                        {queryResult.operation === "delete" && <Trash2 className="w-4 h-4 text-red-500" />}
                        <span className="capitalize">{queryResult.operation}</span>
                        {queryResult.operation === "read" && <span className="text-xs font-normal text-slate-500 ml-1">({queryResult.count} rows)</span>}
                      </CardTitle>
                      {queryResult.operation === "read" && queryResult.pipeline && (
                        <button onClick={() => setShowPipeline(p => !p)} className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                          {showPipeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} Pipeline
                        </button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {queryResult.operation !== "read" && queryResult.message && (
                      <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${queryResult.validationErrors?.length ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400" : queryResult.operation === "insert" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" : queryResult.operation === "update" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"}`}>
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{queryResult.message}</p>
                          {queryResult.validationErrors?.map((e, i) => <p key={i} className="text-xs mt-1">• {e}</p>)}
                        </div>
                      </div>
                    )}
                    {queryResult.operation === "insert" && queryResult.document && !queryResult.validationErrors?.length && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Inserted document:</p>
                        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <table className="min-w-full text-sm"><tbody>
                            {Object.entries(queryResult.document).map(([k, v], i) => (
                              <tr key={k} className={i % 2 === 0 ? "bg-white dark:bg-slate-900/50" : "bg-slate-50/50 dark:bg-slate-800/30"}>
                                <td className="px-3 py-2 font-medium text-slate-600 dark:text-slate-400 w-1/3 border-b border-slate-100 dark:border-slate-800">{k}</td>
                                <td className="px-3 py-2 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800">{String(v)}</td>
                              </tr>
                            ))}
                          </tbody></table>
                        </div>
                      </div>
                    )}
                    {queryResult.operation === "update" && !queryResult.validationErrors?.length && (
                      <div className="grid grid-cols-2 gap-3">
                        <div><p className="text-xs text-slate-500 mb-1">Filter:</p><pre className="text-xs bg-slate-900 text-yellow-400 rounded-lg p-3 overflow-x-auto">{JSON.stringify(queryResult.filter, null, 2)}</pre></div>
                        <div><p className="text-xs text-slate-500 mb-1">Update:</p><pre className="text-xs bg-slate-900 text-blue-400 rounded-lg p-3 overflow-x-auto">{JSON.stringify(queryResult.update, null, 2)}</pre></div>
                      </div>
                    )}
                    {queryResult.operation === "delete" && queryResult.filter && (
                      <div><p className="text-xs text-slate-500 mb-2">Filter used:</p><pre className="text-xs bg-slate-900 text-red-400 rounded-lg p-4 overflow-x-auto">{JSON.stringify(queryResult.filter, null, 2)}</pre></div>
                    )}
                    {queryResult.operation === "read" && (
                      <>
                        {showPipeline && <pre className="text-xs bg-slate-900 text-green-400 rounded-lg p-4 overflow-x-auto max-h-48">{JSON.stringify(queryResult.pipeline, null, 2)}</pre>}
                        {queryResult.results.length === 0
                          ? <p className="text-sm text-slate-500 text-center py-6">No results found.</p>
                          : <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                              <table className="min-w-full text-sm">
                                <thead><tr className="bg-slate-100 dark:bg-slate-800">
                                  {tableColumns.map(c => <th key={c} className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap border-b border-slate-200 dark:border-slate-700">{c}</th>)}
                                </tr></thead>
                                <tbody>{queryResult.results.map((row, i) => (
                                  <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-slate-900/50" : "bg-slate-50/50 dark:bg-slate-800/30"}>
                                    {tableColumns.map(c => <td key={c} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap border-b border-slate-100 dark:border-slate-800">{row[c] == null ? <span className="text-slate-400 italic">null</span> : String(row[c])}</td>)}
                                  </tr>
                                ))}</tbody>
                              </table>
                            </div>
                        }
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
          {/* ════ ANALYTICS VIEW ════ */}
          {sidebarMode === "analytics" && (
            <>
              {!selectedCollection ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                  <BarChart2 className="w-14 h-14 text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Select a collection to analyse</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Choose from the sidebar, then pick an analytics type.</p>
                </div>
              ) : (
                <>
                  {/* Analytics type cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
                    {ANALYTICS_TABS.map(t => (
                      <button key={t.id} onClick={() => { setAnalyticsTab(t.id); setAnalyticsResult(null); setAnalyticsError(""); }}
                        className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${analyticsTab === t.id
                          ? t.color === "blue"   ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : t.color === "purple" ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : t.color === "amber"  ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                          :                        "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                        <div className={`p-2 rounded-lg ${analyticsTab === t.id
                          ? t.color === "blue"   ? "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400"
                          : t.color === "purple" ? "bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-400"
                          : t.color === "amber"  ? "bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-400"
                          :                        "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                          {t.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">{t.question}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Query input */}
                  <Card className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                    <CardContent className="pt-5">
                      {(() => {
                        const t = ANALYTICS_TABS.find(x => x.id === analyticsTab)!;
                        return (
                          <form onSubmit={e => { e.preventDefault(); submitAnalytics(); }} className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`p-1.5 rounded-lg ${t.color === "blue" ? "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400" : t.color === "purple" ? "bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-400" : t.color === "amber" ? "bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-400" : "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400"}`}>{t.icon}</span>
                              <Label className="text-slate-700 dark:text-slate-300 font-semibold">{t.label} Analytics <span className="font-normal text-slate-400">— {t.question}</span></Label>
                            </div>
                            <div className="flex gap-2">
                              <Input placeholder={t.placeholder} value={analyticsQuery} onChange={e => setAnalyticsQuery(e.target.value)} disabled={analyticsLoading}
                                className="flex-1 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" />
                              <Button type="submit" disabled={analyticsLoading || !analyticsQuery.trim()}
                                className={`h-10 px-5 text-white border-0 disabled:opacity-50 ${t.color === "blue" ? "bg-blue-600 hover:bg-blue-700" : t.color === "purple" ? "bg-purple-600 hover:bg-purple-700" : t.color === "amber" ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"}`}>
                                {analyticsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                              </Button>
                            </div>
                          </form>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {analyticsError && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{analyticsError}
                    </div>
                  )}

                  {analyticsResult && (
                    <Card className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base capitalize">
                            {ANALYTICS_TABS.find(t => t.id === analyticsResult.type)?.icon}
                            {analyticsResult.type} Analysis
                            {analyticsResult.count > 0 && <span className="text-xs font-normal text-slate-500">({analyticsResult.count} rows)</span>}
                          </CardTitle>
                          {analyticsResult.pipeline && analyticsResult.pipeline.length > 0 && (
                            <button onClick={() => setShowAnalyticsPipeline(p => !p)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                              {showAnalyticsPipeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} Pipeline
                            </button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {showAnalyticsPipeline && analyticsResult.pipeline && (
                          <pre className="text-xs bg-slate-900 text-green-400 rounded-lg p-4 overflow-x-auto max-h-48">{JSON.stringify(analyticsResult.pipeline, null, 2)}</pre>
                        )}

                        {/* AI Insight */}
                        <div className="px-4 py-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5" /> AI Insight
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{analyticsResult.insight}</p>
                        </div>

                        {/* Chart */}
                        {analyticsResult.results.length > 0 && analyticsResult.chartType !== "none" && (
                          <div className="rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-slate-700/60 p-4">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 capitalize">
                              {analyticsResult.chartType || "bar"} chart
                            </p>
                            <AnalyticsChart data={analyticsResult.results} chartType={analyticsResult.chartType || "bar"} />
                          </div>
                        )}

                        {/* Data table */}
                        {analyticsResult.results.length > 0 && (
                          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                            <table className="min-w-full text-sm">
                              <thead><tr className="bg-slate-100 dark:bg-slate-800">
                                {Object.keys(analyticsResult.results[0]).map(c => (
                                  <th key={c} className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap border-b border-slate-200 dark:border-slate-700">{c}</th>
                                ))}
                              </tr></thead>
                              <tbody>{analyticsResult.results.map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-slate-900/50" : "bg-slate-50/50 dark:bg-slate-800/30"}>
                                  {Object.keys(analyticsResult.results[0]).map(c => (
                                    <td key={c} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap border-b border-slate-100 dark:border-slate-800">
                                      {row[c] == null ? <span className="text-slate-400 italic">null</span> : typeof row[c] === "object" ? <span className="text-xs font-mono text-slate-500">{JSON.stringify(row[c])}</span> : String(row[c])}
                                    </td>
                                  ))}
                                </tr>
                              ))}</tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

