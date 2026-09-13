"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, FlaskConical, Loader2, Sparkles,
  Lightbulb, BookOpen, Cpu, BarChart3,
  Upload, X, FileText, ChevronDown, ChevronUp,
  Download, Copy, Check, RefreshCw, Play,
  History, Clock, Trash2, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import Image from "next/image";

// ─── Data ─────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "idea" as const,
    step: "01",
    label: "Research Idea & Origin",
    hint: "What is the core problem? Why does it matter? How did this research originate?",
    placeholder: `Describe the core idea, what gap or problem it addresses, why it matters to the field, and how it originated. Include the motivation and significance of this research...`,
    icon: <Lightbulb className="w-4 h-4" />,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    activeBorder: "border-indigo-400",
    dot: "bg-indigo-500",
    glowColor: "#6366f1",
    angle: 315,
  },
  {
    id: "prior" as const,
    step: "02",
    label: "Previous Work & Background",
    hint: "What has been done before? What are the key references and their limitations?",
    placeholder: `Describe related work, existing approaches, key papers and their contributions, gaps in the literature, and what specifically your work improves upon...`,
    icon: <BookOpen className="w-4 h-4" />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    activeBorder: "border-violet-400",
    dot: "bg-violet-500",
    glowColor: "#8b5cf6",
    angle: 45,
  },
  {
    id: "approach" as const,
    step: "03",
    label: "Your Approach & Methodology",
    hint: "How did you do it? What methods, tools, datasets, and experiments did you use?",
    placeholder: `Explain your methodology in detail — experimental setup, datasets, algorithms, tools, model architecture, evaluation metrics, and how you validated your approach...`,
    icon: <Cpu className="w-4 h-4" />,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    activeBorder: "border-cyan-400",
    dot: "bg-cyan-500",
    glowColor: "#06b6d4",
    angle: 135,
  },
  {
    id: "result" as const,
    step: "04",
    label: "Results, Findings & Future Scope",
    hint: "What did you find? What are the conclusions and what comes next?",
    placeholder: `Describe your key results, performance metrics, comparisons with baselines, what the findings mean, limitations of the current work, and promising directions for future research...`,
    icon: <BarChart3 className="w-4 h-4" />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    activeBorder: "border-amber-400",
    dot: "bg-amber-500",
    glowColor: "#f59e0b",
    angle: 225,
  },
];

const EXPORT_FORMATS = [
  { id: "standard", label: "Word Document (.docx)", ext: "docx" },
  { id: "ieee", label: "IEEE LaTeX Format (.txt)", ext: "txt" },
  { id: "springer", label: "Springer One-Pager (.txt)", ext: "txt" },
  { id: "acm", label: "ACM Format (.txt)", ext: "txt" },
  { id: "abstract", label: "Extended Abstract (.txt)", ext: "txt" },
];

type SectionId = "idea" | "prior" | "approach" | "result";
type StageKey = SectionId | "synthesis";
type AgentStatus = "idle" | "running" | "complete";

interface ResearchSessionMeta {
  _id: string;
  title: string;
  updatedAt: string;
  inputs: Record<SectionId, string>;
  output: string;
}

// ─── Canvas Orb (minimal, embedded in left panel) ─────────────────────────────

interface Photon { id: number; fromAngle: number; progress: number; toCenter: boolean; color: string; }

function MiniOrb({ activeNodes, allComplete, synthComplete }: {
  activeNodes: Set<StageKey>; allComplete: boolean; synthComplete: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photonsRef = useRef<Photon[]>([]);
  const frameRef = useRef<number>(0);
  const nextId = useRef(0);

  const nodePos = useCallback((angle: number, r: number, cx: number, cy: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const S = canvas.width, cx = S / 2, cy = S / 2;
    const OR = S * 0.33, NR = S * 0.07, CR = S * 0.10;
    let t = 0;

    const spawn = setInterval(() => {
      SECTIONS.forEach(n => {
        if (!activeNodes.has(n.id)) return;
        photonsRef.current.push({ id: nextId.current++, fromAngle: n.angle, progress: 0, toCenter: true, color: n.glowColor });
      });
      if (allComplete && !synthComplete) {
        const cols = ["#6366f1","#8b5cf6","#06b6d4","#f59e0b"];
        photonsRef.current.push({ id: nextId.current++, fromAngle: Math.random()*360, progress: 0, toCenter: false, color: cols[Math.floor(Math.random()*4)] });
      }
    }, 220);

    const draw = () => {
      ctx.clearRect(0, 0, S, S);
      t += 0.006;

      // orbit
      ctx.beginPath(); ctx.arc(cx, cy, OR, 0, Math.PI*2);
      ctx.strokeStyle = "rgba(99,102,241,0.18)"; ctx.lineWidth = 1.2; ctx.stroke();

      // rotating dash
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(t);
      ctx.beginPath(); ctx.arc(0,0,OR+7,0,Math.PI*2);
      ctx.strokeStyle="rgba(99,102,241,0.07)"; ctx.lineWidth=1;
      ctx.setLineDash([3,18]); ctx.stroke(); ctx.setLineDash([]); ctx.restore();

      // center
      const cg = ctx.createRadialGradient(cx,cy,0,cx,cy,CR);
      if (synthComplete) { cg.addColorStop(0,"rgba(74,222,128,0.95)"); cg.addColorStop(1,"rgba(16,185,129,0.15)"); }
      else if (allComplete) { cg.addColorStop(0,"rgba(251,191,36,0.95)"); cg.addColorStop(1,"rgba(245,158,11,0.15)"); }
      else { cg.addColorStop(0,"rgba(99,102,241,0.75)"); cg.addColorStop(1,"rgba(139,92,246,0.1)"); }
      ctx.beginPath(); ctx.arc(cx,cy,CR,0,Math.PI*2); ctx.fillStyle=cg; ctx.fill();
      const pulse = CR+5+Math.sin(t*4)*2.5;
      ctx.beginPath(); ctx.arc(cx,cy,pulse,0,Math.PI*2);
      ctx.strokeStyle=allComplete?"rgba(16,185,129,0.2)":"rgba(99,102,241,0.15)"; ctx.lineWidth=1.2; ctx.stroke();
      ctx.fillStyle="#fff"; ctx.font=`bold ${Math.round(S*0.045)}px sans-serif`;
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(synthComplete?"✓":allComplete?"⚡":"AI",cx,cy);

      // nodes
      SECTIONS.forEach(n => {
        const p = nodePos(n.angle, OR, cx, cy);
        const active = activeNodes.has(n.id);
        if (active) {
          const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,NR*1.8);
          g.addColorStop(0,n.glowColor+"40"); g.addColorStop(1,n.glowColor+"00");
          ctx.beginPath(); ctx.arc(p.x,p.y,NR*1.8,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
          const lg = ctx.createLinearGradient(p.x,p.y,cx,cy);
          lg.addColorStop(0,n.glowColor+"50"); lg.addColorStop(1,n.glowColor+"00");
          ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(cx,cy);
          ctx.strokeStyle=lg; ctx.lineWidth=0.8; ctx.stroke();
        }
        const ng = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,NR);
        ng.addColorStop(0,active?n.glowColor+"ee":"rgba(203,213,225,0.7)");
        ng.addColorStop(1,active?n.glowColor+"66":"rgba(148,163,184,0.3)");
        ctx.beginPath(); ctx.arc(p.x,p.y,NR,0,Math.PI*2); ctx.fillStyle=ng; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x,p.y,NR,0,Math.PI*2);
        ctx.strokeStyle=active?n.glowColor+"bb":"rgba(203,213,225,0.5)"; ctx.lineWidth=1.2; ctx.stroke();
      });

      // photons
      photonsRef.current = photonsRef.current.filter(p=>p.progress<1);
      photonsRef.current.forEach(p => {
        p.progress = Math.min(p.progress+0.032,1);
        let sx:number,sy:number,ex:number,ey:number;
        if (p.toCenter) { const sp=nodePos(p.fromAngle,OR,cx,cy); sx=sp.x;sy=sp.y;ex=cx;ey=cy; }
        else { sx=cx;sy=cy; const ep=nodePos(p.fromAngle,OR*1.4,cx,cy); ex=ep.x;ey=ep.y; }
        const px=sx+(ex-sx)*p.progress, py=sy+(ey-sy)*p.progress;
        const pg=ctx.createRadialGradient(px,py,0,px,py,4);
        pg.addColorStop(0,p.color+"ff"); pg.addColorStop(1,p.color+"00");
        ctx.beginPath(); ctx.arc(px,py,4,0,Math.PI*2); ctx.fillStyle=pg; ctx.fill();
        const t0=Math.max(0,p.progress-0.12);
        const px0=sx+(ex-sx)*t0, py0=sy+(ey-sy)*t0;
        const tg=ctx.createLinearGradient(px0,py0,px,py);
        tg.addColorStop(0,p.color+"00"); tg.addColorStop(1,p.color+"88");
        ctx.beginPath(); ctx.moveTo(px0,py0); ctx.lineTo(px,py);
        ctx.strokeStyle=tg; ctx.lineWidth=2; ctx.stroke();
      });

      frameRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { clearInterval(spawn); cancelAnimationFrame(frameRef.current); };
  }, [activeNodes, allComplete, synthComplete, nodePos]);

  return <canvas ref={canvasRef} width={180} height={180} className="w-[160px] h-[160px]" />;
}

// ─── Markdown → styled JSX renderer ──────────────────────────────────────────

function PaperPreview({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    elements.push(
      <ul key={`ul-${i}`} className="list-disc ml-6 my-2 space-y-1">
        {listBuffer.map((item, li) => (
          <li key={li} className="text-[13px] leading-relaxed text-slate-700 font-serif">{parseInline(item)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  const parseInline = (text: string): React.ReactNode => {
    // Handle **bold**, *italic*, `code`
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={idx} className="font-semibold text-slate-900">{part.slice(2,-2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
        return <em key={idx} className="italic text-slate-700">{part.slice(1,-1)}</em>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={idx} className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-800">{part.slice(1,-1)}</code>;
      return <span key={idx}>{part}</span>;
    });
  };

  while (i < lines.length) {
    const line = lines[i];

    // HR
    if (line.match(/^-{3,}$/) || line.match(/^\*{3,}$/) || line.match(/^_{3,}$/)) {
      flushList();
      elements.push(<hr key={i} className="my-4 border-t border-slate-200" />);
      i++; continue;
    }

    // H1
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={i} className="font-serif text-xl font-bold text-slate-900 text-center mt-6 mb-1 leading-snug tracking-tight">
          {parseInline(line.slice(2))}
        </h1>
      );
      i++; continue;
    }

    // H2
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={i} className="font-serif text-base font-bold text-slate-800 mt-5 mb-1.5 uppercase tracking-wide border-b border-slate-200 pb-1">
          {parseInline(line.slice(3))}
        </h2>
      );
      i++; continue;
    }

    // H3
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={i} className="font-serif text-[13px] font-bold italic text-slate-800 mt-4 mb-1">
          {parseInline(line.slice(4))}
        </h3>
      );
      i++; continue;
    }

    // Bullet
    if (line.match(/^[•\-\*]\s/)) {
      listBuffer.push(line.replace(/^[•\-\*]\s/, ""));
      i++; continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      flushList();
      elements.push(
        <p key={i} className="font-serif text-[13px] text-slate-700 leading-relaxed ml-5">
          {parseInline(line)}
        </p>
      );
      i++; continue;
    }

    // Bold-only line (section label)
    if (line.startsWith("**") && line.endsWith("**") && !line.slice(2,-2).includes("**")) {
      flushList();
      elements.push(
        <p key={i} className="font-serif text-[13px] font-bold text-slate-800 mt-3 mb-0.5">
          {line.slice(2,-2)}
        </p>
      );
      i++; continue;
    }

    // Blank
    if (line.trim() === "") {
      flushList();
      elements.push(<div key={i} className="h-2" />);
      i++; continue;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p key={i} className="font-serif text-[13px] text-slate-700 leading-relaxed text-justify mb-1">
        {parseInline(line)}
      </p>
    );
    i++;
  }
  flushList();

  return <div className="space-y-0.5">{elements}</div>;
}

// ─── DOCX download (real binary via docx lib) ─────────────────────────────────

async function downloadAsDocx(content: string, filename: string) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [];

  for (const line of content.split("\n")) {
    if (line.match(/^-{3,}$/) || line.match(/^\*{3,}$/)) {
      children.push(new Paragraph({ text: "──────────────────────────────────────", spacing: { after: 120 } }));
    } else if (line.startsWith("# ")) {
      children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 240 } }));
    } else if (line.startsWith("## ")) {
      children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2, spacing: { before: 320, after: 120 } }));
    } else if (line.startsWith("### ")) {
      children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 } }));
    } else if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      children.push(new Paragraph({ children: [new TextRun({ text: line.slice(2,-2), bold: true })], spacing: { after: 120 } }));
    } else if (line.match(/^[•\-\*]\s/)) {
      children.push(new Paragraph({ children: [new TextRun({ text: line.replace(/^[•\-\*]\s/,"") })], bullet: { level: 0 }, spacing: { after: 60 } }));
    } else if (line.trim() === "") {
      children.push(new Paragraph({ text: "", spacing: { after: 80 } }));
    } else {
      // parse inline bold/italic
      const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
      const runs = parts.map(part => {
        if (part.startsWith("**") && part.endsWith("**"))
          return new TextRun({ text: part.slice(2,-2), bold: true });
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
          return new TextRun({ text: part.slice(1,-1), italics: true });
        return new TextRun({ text: part });
      });
      children.push(new Paragraph({ children: runs, alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 } }));
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Times New Roman", size: 24 } } } },
    sections: [{ properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function downloadAsText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIResearchPage() {
  const { status } = useSession();
  const router = useRouter();

  const [inputs, setInputs] = useState<Record<SectionId, string>>({ idea: "", prior: "", approach: "", result: "" });
  const [files, setFiles]   = useState<Record<SectionId, { name: string } | null>>({ idea: null, prior: null, approach: null, result: null });
  const [activeSection, setActiveSection] = useState<SectionId>("idea");
  const [agentStatus, setAgentStatus]     = useState<AgentStatus>("idle");
  const [activeNodes, setActiveNodes]     = useState<Set<StageKey>>(new Set());
  const [completedNodes, setCompletedNodes] = useState<Set<StageKey>>(new Set());
  const [allComplete, setAllComplete]     = useState(false);
  const [synthComplete, setSynthComplete] = useState(false);
  const [currentStage, setCurrentStage]   = useState("");
  const [output, setOutput]               = useState("");
  const [error, setError]                 = useState("");
  const [copied, setCopied]               = useState(false);
  const [exportOpen, setExportOpen]       = useState(false);
  const [exporting, setExporting]         = useState(false);
  const [uploading, setUploading]         = useState<SectionId | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // ── History state ──────────────────────────────────────────────────────────
  const [historySessions, setHistorySessions] = useState<ResearchSessionMeta[]>([]);
  const [historyLoading, setHistoryLoading]   = useState(false);
  const [historyOpen, setHistoryOpen]         = useState(true);
  const [deletingId, setDeletingId]           = useState<string | null>(null);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  // ── History: fetch list ────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/research/sessions");
      if (res.ok) {
        const data = await res.json();
        setHistorySessions(data.sessions || []);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { if (status === "authenticated") fetchHistory(); }, [status, fetchHistory]);

  // ── History: load a past session ──────────────────────────────────────────
  const loadSession = (s: ResearchSessionMeta) => {
    setInputs({
      idea:     s.inputs.idea     ?? "",
      prior:    s.inputs.prior    ?? "",
      approach: s.inputs.approach ?? "",
      result:   s.inputs.result   ?? "",
    });
    setOutput(s.output ?? "");
    setAgentStatus(s.output ? "complete" : "idle");
    setActiveNodes(new Set());
    setCompletedNodes(new Set());
    setAllComplete(false);
    setSynthComplete(false);
    setError("");
    setActiveSection("idea");
    if (outputRef.current) outputRef.current.scrollTop = 0;
  };

  // ── History: delete ───────────────────────────────────────────────────────
  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this research session?")) return;
    setDeletingId(id);
    await fetch(`/api/research/sessions/${id}`, { method: "DELETE" });
    setHistorySessions(prev => prev.filter(s => s._id !== id));
    setDeletingId(null);
  };

  // ── History: save after generation ───────────────────────────────────────
  const saveSession = useCallback(async (savedInputs: Record<SectionId, string>, savedOutput: string) => {
    try {
      const res = await fetch("/api/research/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: savedInputs, output: savedOutput }),
      });
      if (res.ok) fetchHistory();
    } catch { /* silent */ }
  }, [fetchHistory]);

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll output to top when new content arrives
  useEffect(() => {
    if (output && outputRef.current) outputRef.current.scrollTop = 0;
  }, [output]);

  const handleFileUpload = async (sectionId: SectionId, file: File) => {
    setUploading(sectionId);
    setError("");
    try {
      let text = "";
      if (file.name.toLowerCase().endsWith(".pdf")) {
        const { extractText, getDocumentProxy } = await import("unpdf");
        const buf = new Uint8Array(await file.arrayBuffer());
        const pdf = await getDocumentProxy(buf);
        const { text: extracted } = await extractText(pdf, { mergePages: true });
        text = Array.isArray(extracted) ? extracted.join(" ") : extracted;
      } else {
        text = await file.text();
      }
      const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 3000);
      setFiles(p => ({ ...p, [sectionId]: { name: file.name } }));
      setInputs(p => ({ ...p, [sectionId]: p[sectionId] ? `${p[sectionId]}\n\n[Extracted from ${file.name}]:\n${cleaned}` : cleaned }));
    } catch {
      setError(`Could not read ${file.name}`);
    } finally {
      setUploading(null);
    }
  };

  const removeFile = (sectionId: SectionId) => {
    setFiles(p => ({ ...p, [sectionId]: null }));
  };

  const generate = useCallback(async () => {
    const missing = SECTIONS.filter(s => !inputs[s.id]?.trim()).map(s => s.label);
    if (missing.length) { setError(`Please fill in: ${missing.join(", ")}`); return; }

    setAgentStatus("running");
    setOutput(""); setError("");
    setActiveNodes(new Set()); setCompletedNodes(new Set());
    setAllComplete(false); setSynthComplete(false);

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    for (const sec of SECTIONS) {
      setCurrentStage(`Analyzing ${sec.label}...`);
      setActiveNodes(prev => new Set([...prev, sec.id]));
      await delay(1500);
      setCompletedNodes(prev => new Set([...prev, sec.id]));
    }

    setAllComplete(true);
    setCurrentStage("Synthesizing paper...");
    await delay(800);

    try {
      const res = await fetch("/api/research/ai-research/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inputs, format: "standard" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSynthComplete(true);
        setCurrentStage("Complete");
        setOutput(data.content);
        setAgentStatus("complete");
        // Save to history
        saveSession(inputs, data.content);
      } else {
        setError(data.message || "Generation failed");
        setAgentStatus("idle");
      }
    } catch {
      setError("Request failed. Try again.");
      setAgentStatus("idle");
    }
  }, [inputs]);

  const handleExport = async (formatId: string) => {
    setExportOpen(false);
    setExporting(true);
    const fmt = EXPORT_FORMATS.find(f => f.id === formatId)!;
    const filename = `research-paper-${formatId}.${fmt.ext}`;

    if (formatId === "standard") {
      await downloadAsDocx(output, filename);
    } else if (formatId === "ieee" || formatId === "springer" || formatId === "acm" || formatId === "abstract") {
      // Re-generate in requested format
      try {
        const res = await fetch("/api/research/ai-research/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...inputs, format: formatId }),
        });
        const data = await res.json();
        if (res.ok) downloadAsText(data.content, filename);
        else setError("Export failed");
      } catch { setError("Export failed"); }
    }
    setExporting(false);
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setAgentStatus("idle"); setOutput(""); setError("");
    setActiveNodes(new Set()); setCompletedNodes(new Set());
    setAllComplete(false); setSynthComplete(false); setCurrentStage("");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const allFilled = SECTIONS.every(s => inputs[s.id]?.trim());

  return (
    <main className="h-screen flex flex-col bg-slate-50 overflow-hidden" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>

      {/* ── Ambient backgrounds ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-amber-50/60 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[140px] bg-indigo-200/30 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] bg-amber-200/20 pointer-events-none" />

      {/* ── Header ── */}
      <header className="relative z-20 flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-slate-200/70 bg-white/70 backdrop-blur-md">
        <button onClick={() => router.push("/research")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-100">
            <FlaskConical className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-sm font-semibold text-slate-800">AI Research Summary</span>
        </div>
        <Image src="/logo.png" alt="Agento" width={80} height={48} className="opacity-80" />
      </header>

      {/* ── Two-column workspace ── */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ══════════════════════════════════════
            LEFT — Input Editor
        ══════════════════════════════════════ */}
        <div className="w-[400px] flex-shrink-0 flex flex-col border-r border-slate-200/70 bg-white/60 overflow-hidden">

          {/* Section accordion */}
          <div className="flex-1 overflow-y-auto">
            {SECTIONS.map((sec, idx) => {
              const isOpen     = activeSection === sec.id;
              const isDone     = completedNodes.has(sec.id);
              const isActive   = activeNodes.has(sec.id) && !isDone;
              const hasContent = !!inputs[sec.id]?.trim();

              return (
                <div key={sec.id} className={`border-b border-slate-100 transition-all ${isOpen ? "bg-white" : "bg-white/40 hover:bg-white/70"}`}>

                  {/* Accordion header */}
                  <button
                    onClick={() => setActiveSection(sec.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left group"
                  >
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                      isDone   ? "bg-green-500 text-white" :
                      isActive ? `${sec.bg} ${sec.color} border-2 ${sec.activeBorder}` :
                      hasContent ? `${sec.bg} ${sec.color}` :
                      "bg-slate-100 text-slate-400"
                    }`}>
                      {isDone ? "✓" : isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : sec.step}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isDone ? "text-green-700" : isActive ? sec.color : hasContent ? "text-slate-800" : "text-slate-500"}`}>
                        {sec.label}
                      </p>
                      {!isOpen && hasContent && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{inputs[sec.id].slice(0, 60)}...</p>
                      )}
                      {!isOpen && !hasContent && (
                        <p className="text-[11px] text-slate-300 mt-0.5">{sec.hint}</p>
                      )}
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </button>

                  {/* Accordion body */}
                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-[11px] text-slate-400 leading-relaxed">{sec.hint}</p>

                      <textarea
                        value={inputs[sec.id]}
                        onChange={e => setInputs(p => ({ ...p, [sec.id]: e.target.value }))}
                        placeholder={sec.placeholder}
                        disabled={agentStatus === "running"}
                        rows={7}
                        className={`w-full text-[13px] leading-relaxed px-3.5 py-3 rounded-xl border bg-white/90 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent placeholder:text-slate-300 disabled:opacity-50 transition-all ${sec.border}`}
                        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                      />

                      {/* Footer toolbar */}
                      <div className="flex items-center gap-2">
                        {files[sec.id] ? (
                          <div className="flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
                            <FileText className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                            <span className="truncate flex-1 font-medium">{files[sec.id]!.name}</span>
                            <button onClick={() => removeFile(sec.id)} className="text-slate-400 hover:text-red-500 transition-colors ml-1">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 text-[11px] font-medium transition-all cursor-pointer">
                            {uploading === sec.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            Upload PDF / TXT
                            <input
                              type="file"
                              accept=".pdf,.txt,.md"
                              className="hidden"
                              disabled={agentStatus === "running" || uploading === sec.id}
                              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(sec.id, f); e.target.value = ""; }}
                            />
                          </label>
                        )}

                        {idx < SECTIONS.length - 1 && hasContent && agentStatus === "idle" && (
                          <button
                            onClick={() => setActiveSection(SECTIONS[idx + 1].id)}
                            className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg ${sec.bg} ${sec.color} text-[11px] font-semibold hover:opacity-80 transition-all`}
                          >
                            Next →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Bottom: orb + generate button ── */}
          <div className="flex-shrink-0 border-t border-slate-200/70 bg-white/60 px-4 py-4">
            <div className="flex items-center gap-4">
              {/* Mini orb */}
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 rounded-full blur-[30px] bg-indigo-200/30 pointer-events-none" />
                <MiniOrb activeNodes={activeNodes} allComplete={allComplete} synthComplete={synthComplete} />
              </div>

              {/* Right side: status + button */}
              <div className="flex-1 flex flex-col gap-2">
                {agentStatus === "running" && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-500">{currentStage}</p>
                    <div className="space-y-1">
                      {SECTIONS.map(n => {
                        const done = completedNodes.has(n.id);
                        const act  = activeNodes.has(n.id) && !done;
                        return (
                          <div key={n.id} className={`flex items-center gap-1.5 text-[10px] font-medium transition-all ${done ? "text-green-600" : act ? n.color : "text-slate-300"}`}>
                            {done ? <span className={`w-2.5 h-2.5 rounded-full ${n.dot} flex items-center justify-center`}><span className="text-white" style={{fontSize:7}}>✓</span></span>
                              : act ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              : <span className="w-2.5 h-2.5 rounded-full border border-current opacity-30" />}
                            {n.label.split(" ").slice(0,2).join(" ")}
                          </div>
                        );
                      })}
                      <div className={`flex items-center gap-1.5 text-[10px] font-medium transition-all ${synthComplete ? "text-green-600" : allComplete ? "text-amber-600" : "text-slate-300"}`}>
                        {synthComplete ? <Sparkles className="w-2.5 h-2.5" /> : allComplete ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5 opacity-30" />}
                        Final Synthesis
                      </div>
                    </div>
                  </div>
                )}

                {agentStatus === "idle" && (
                  <>
                    {error && <p className="text-[11px] text-red-500">{error}</p>}
                    <button
                      onClick={generate}
                      disabled={!allFilled}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-amber-200/50 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Play className="w-3.5 h-3.5" /> Generate Paper
                    </button>
                    {!allFilled && (
                      <p className="text-[10px] text-slate-400 text-center">Fill all 4 sections to generate</p>
                    )}
                  </>
                )}

                {agentStatus === "running" && (
                  <button disabled className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                  </button>
                )}

                {agentStatus === "complete" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-green-700 font-medium">
                      <Sparkles className="w-3.5 h-3.5" /> Paper generated — export from the right panel
                    </div>
                    <button onClick={reset} className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-all">
                      <RefreshCw className="w-3.5 h-3.5" /> Start Over
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            HISTORY SIDEBAR — collapsible
        ══════════════════════════════════════ */}
        <div className={`flex-shrink-0 flex flex-col border-r border-slate-200/70 bg-white/50 transition-all duration-300 ${historyOpen ? "w-56" : "w-10"}`}>

          {/* Sidebar toggle header */}
          <div className={`flex-shrink-0 flex items-center border-b border-slate-200/70 bg-white/70 ${historyOpen ? "justify-between px-3 py-2.5" : "justify-center py-2.5"}`}>
            {historyOpen && (
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">History</span>
                {historyLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
              </div>
            )}
            <button
              onClick={() => setHistoryOpen(p => !p)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              title={historyOpen ? "Collapse history" : "Show history"}
            >
              {historyOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          </div>

          {/* Session list */}
          {historyOpen && (
            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
              {!historyLoading && historySessions.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
                  <History className="w-7 h-7 text-slate-200" />
                  <p className="text-[10px] text-slate-400">No past papers yet</p>
                  <p className="text-[10px] text-slate-300">Generate one to save it here</p>
                </div>
              )}

              {historySessions.map(s => (
                <div
                  key={s._id}
                  onClick={() => loadSession(s)}
                  className="group flex items-start gap-2 px-2.5 py-2 rounded-lg cursor-pointer border border-transparent hover:bg-amber-50 hover:border-amber-200 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-slate-700 leading-tight truncate group-hover:text-amber-800">
                      {s.title}
                    </p>
                    <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(s.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={e => deleteSession(s._id, e)}
                    disabled={deletingId === s._id}
                    className="flex-shrink-0 p-0.5 mt-0.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all rounded"
                  >
                    {deletingId === s._id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════
            RIGHT — Live Paper Preview
        ══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/50">

          {/* Preview toolbar */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-slate-200/70 bg-white/70 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">Paper Preview</span>
              {output && (
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold border border-green-200">
                  Ready
                </span>
              )}
            </div>

            {output && (
              <div className="flex items-center gap-2">
                {/* Copy */}
                <button
                  onClick={copyOutput}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>

                {/* Export dropdown */}
                <div className="relative" ref={exportRef}>
                  <button
                    onClick={() => setExportOpen(p => !p)}
                    disabled={exporting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-60"
                  >
                    {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Export
                    <ChevronDown className={`w-3 h-3 transition-transform ${exportOpen ? "rotate-180" : ""}`} />
                  </button>

                  {exportOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden z-50">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Choose Export Format</p>
                      </div>
                      {EXPORT_FORMATS.map(fmt => (
                        <button
                          key={fmt.id}
                          onClick={() => handleExport(fmt.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                          <span className="text-xs font-medium">{fmt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview body */}
          <div ref={outputRef} className="flex-1 overflow-y-auto">
            {/* Empty state */}
            {!output && agentStatus === "idle" && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 flex items-center justify-center">
                  <FlaskConical className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-600">Live Paper Preview</p>
                  <p className="text-sm text-slate-400 mt-1 max-w-xs">Fill in the 4 sections on the left and click <strong className="text-amber-600">Generate Paper</strong>. Your formatted research paper will appear here.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 w-full max-w-sm">
                  {SECTIONS.map(s => (
                    <div key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${s.bg} border ${s.border} text-[11px] ${s.color} font-medium`}>
                      {s.icon} {s.label.split(" ")[0]} {s.label.split(" ")[1]}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Running state */}
            {agentStatus === "running" && !output && (
              <div className="h-full flex flex-col items-center justify-center gap-5 p-8">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-2 border-amber-200 animate-spin-slow" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">{currentStage}</p>
                  <p className="text-xs text-slate-400 mt-1">Building your research paper...</p>
                </div>
                {/* Skeleton lines */}
                <div className="w-full max-w-md space-y-2.5">
                  {[0.5, 0.9, 0.75, 0.95, 0.6, 0.85, 0.4, 0.7].map((w, i) => (
                    <div key={i} className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-200 to-orange-200 animate-pulse"
                        style={{ width: `${w * 100}%`, animationDelay: `${i * 120}ms` }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rendered output — academic paper style */}
            {output && (
              <div className="max-w-2xl mx-auto my-8 px-6">
                {/* Paper sheet */}
                <div
                  className="bg-white rounded-xl shadow-lg border border-slate-200/80 px-10 py-10 min-h-[600px]"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  <PaperPreview content={output} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
