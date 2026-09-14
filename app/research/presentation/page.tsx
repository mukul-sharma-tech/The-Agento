"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Presentation, Sparkles, Loader2, Play, Download,
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Plus, Trash2,
  Edit3, Check, Copy, RefreshCw, Upload, FileText, X,
  LayoutGrid, Sliders, History, Save, Sparkle, Layers,
  PanelLeftClose, PanelLeftOpen, MoveUp, MoveDown, CheckCircle2,
  FileCode, Palette, Users, Mic, Quote, TrendingUp
} from "lucide-react";
import pptxgen from "pptxgenjs";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ISlide {
  slideNumber: number;
  title: string;
  subtitle?: string;
  badge?: string;
  layout?: "title" | "bullets" | "two-column" | "stat-highlight" | "quote" | "conclusion";
  points?: string[];
  secondaryPoints?: string[];
  stat?: {
    value: string;
    label: string;
  };
  quote?: string;
  presenterNotes?: string;
}

export interface IDeck {
  title: string;
  subtitle?: string;
  slides: ISlide[];
}

export interface IPresentationSession {
  _id: string;
  title: string;
  topic: string;
  slideCount: number;
  theme: string;
  tone: string;
  targetAudience: string;
  rawContent: string;
  slides: ISlide[];
  createdAt: string;
  updatedAt: string;
}

// ─── Themes & Styles ─────────────────────────────────────────────────────────

interface ThemeConfig {
  id: string;
  name: string;
  accent: string;
  bgClass: string;
  cardClass: string;
  textClass: string;
  badgeClass: string;
  pptx: {
    bg: string;
    cardBg: string;
    text: string;
    subText: string;
    accent: string;
    accentLight: string;
    font: string;
  };
}

const THEMES: Record<string, ThemeConfig> = {
  indigo: {
    id: "indigo",
    name: "Modern Indigo",
    accent: "from-indigo-600 to-violet-600",
    bgClass: "bg-slate-900 text-slate-100",
    cardClass: "bg-slate-800/80 border-indigo-500/30",
    textClass: "text-indigo-400",
    badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    pptx: {
      bg: "0F172A",
      cardBg: "1E293B",
      text: "F8FAFC",
      subText: "94A3B8",
      accent: "6366F1",
      accentLight: "818CF8",
      font: "Calibri",
    },
  },
  dark: {
    id: "dark",
    name: "Midnight Cyber",
    accent: "from-cyan-500 to-fuchsia-600",
    bgClass: "bg-zinc-950 text-zinc-100",
    cardClass: "bg-zinc-900/90 border-cyan-500/30",
    textClass: "text-cyan-400",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    pptx: {
      bg: "09090B",
      cardBg: "18181B",
      text: "FAFAFA",
      subText: "A1A1AA",
      accent: "06B6D4",
      accentLight: "22D3EE",
      font: "Segoe UI",
    },
  },
  emerald: {
    id: "emerald",
    name: "Emerald Growth",
    accent: "from-emerald-500 to-teal-700",
    bgClass: "bg-slate-900 text-slate-100",
    cardClass: "bg-slate-800/90 border-emerald-500/30",
    textClass: "text-emerald-400",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    pptx: {
      bg: "064E3B",
      cardBg: "065F46",
      text: "ECFDF5",
      subText: "A7F3D0",
      accent: "10B981",
      accentLight: "34D399",
      font: "Arial",
    },
  },
  corporate: {
    id: "corporate",
    name: "Royal Corporate",
    accent: "from-blue-700 to-indigo-900",
    bgClass: "bg-slate-950 text-slate-100",
    cardClass: "bg-slate-900/90 border-blue-500/30",
    textClass: "text-blue-400",
    badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    pptx: {
      bg: "0B132B",
      cardBg: "1C2541",
      text: "FFFFFF",
      subText: "CBD5E1",
      accent: "3B82F6",
      accentLight: "60A5FA",
      font: "Helvetica",
    },
  },
  sunset: {
    id: "sunset",
    name: "Sunset Pitch",
    accent: "from-amber-500 via-rose-500 to-purple-600",
    bgClass: "bg-neutral-900 text-neutral-100",
    cardClass: "bg-neutral-800/90 border-rose-500/30",
    textClass: "text-rose-400",
    badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    pptx: {
      bg: "18181B",
      cardBg: "27272A",
      text: "FAFAFA",
      subText: "D4D4D8",
      accent: "F43F5E",
      accentLight: "FB7185",
      font: "Segoe UI",
    },
  },
  minimal: {
    id: "minimal",
    name: "Nordic Minimal",
    accent: "from-slate-700 to-slate-900",
    bgClass: "bg-white text-slate-900",
    cardClass: "bg-slate-50 border-slate-200",
    textClass: "text-slate-800",
    badgeClass: "bg-slate-200 text-slate-700 border-slate-300",
    pptx: {
      bg: "FFFFFF",
      cardBg: "F8FAFC",
      text: "0F172A",
      subText: "475569",
      accent: "334155",
      accentLight: "64748B",
      font: "Calibri",
    },
  },
};

const TONES = [
  { id: "professional", label: "Executive & Professional" },
  { id: "pitch", label: "Investor Pitch / Startup" },
  { id: "educational", label: "Educational / Workshop" },
  { id: "technical", label: "Technical Deep-Dive" },
  { id: "creative", label: "Creative & Engaging" },
];

const AUDIENCES = [
  { id: "executives", label: "Executives & C-Suite" },
  { id: "investors", label: "Investors / Venture" },
  { id: "engineers", label: "Engineers & Developers" },
  { id: "clients", label: "Clients & Stakeholders" },
  { id: "students", label: "Students / Academic" },
  { id: "general", label: "General Audience" },
];

const SLIDE_PRESETS = [3, 5, 6, 8, 10, 12, 15];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PresentationStudioPage() {
  const { status } = useSession();
  const router = useRouter();

  // Inputs
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [slideCount, setSlideCount] = useState(6);
  const [theme, setTheme] = useState("indigo");
  const [tone, setTone] = useState("professional");
  const [targetAudience, setTargetAudience] = useState("executives");
  const [includeNotes, setIncludeNotes] = useState(true);

  // Studio State
  const [deck, setDeck] = useState<IDeck | null>(null);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [viewMode, setViewMode] = useState<"player" | "grid">("player");
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  // History & Sessions
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState<IPresentationSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Load Sessions
  const loadSessions = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/research/presentation/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error("Failed to load sessions:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      loadSessions();
    }
  }, [status, loadSessions]);

  // Keyboard navigation for player mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!deck || isEditing) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        setCurrentSlideIdx((prev) => Math.min(prev + 1, deck.slides.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setCurrentSlideIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Home") {
        e.preventDefault();
        setCurrentSlideIdx(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setCurrentSlideIdx(deck.slides.length - 1);
      } else if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deck, isEditing]);

  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // File Upload Text Extraction
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setGenerationStep("Extracting text from file...");
      let extractedText = "";

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const { extractText } = await import("unpdf");
        const buffer = await file.arrayBuffer();
        const res = await extractText(new Uint8Array(buffer));
        extractedText = Array.isArray(res.text) ? res.text.join("\n") : res.text;
      } else {
        extractedText = await file.text();
      }

      setContent((prev) => (prev ? `${prev}\n\n${extractedText}` : extractedText));
      if (!topic) {
        const base = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTopic(base.charAt(0).toUpperCase() + base.slice(1));
      }
    } catch (err) {
      console.error("File extraction error:", err);
      alert("Failed to parse file. Please copy-paste the text directly.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Generate Deck
  const handleGenerate = async () => {
    if (!topic.trim() && !content.trim()) {
      alert("Please provide a topic or paste content/notes to generate slides.");
      return;
    }

    setLoading(true);
    setGenerationStep("Analyzing content & structuring narrative outline...");

    try {
      const stepTimer1 = setTimeout(() => {
        setGenerationStep("Drafting slide bullet points, metrics & key takeaways...");
      }, 1500);

      const stepTimer2 = setTimeout(() => {
        setGenerationStep("Polishing 16:9 layout, visual hierarchy & speaker cues...");
      }, 3500);

      const res = await fetch("/api/research/presentation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          content,
          slideCount,
          theme,
          tone,
          targetAudience,
          includeNotes,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Generation failed");
      }

      const data = await res.json();
      if (data.data && Array.isArray(data.data.slides)) {
        setDeck(data.data);
        setCurrentSlideIdx(0);
        setIsEditing(false);

        // Auto save to database
        await handleSaveDeck(data.data);
      }
    } catch (err) {
      console.error("Presentation generation error:", err);
      alert((err as Error).message || "Failed to generate presentation. Please retry.");
    } finally {
      setLoading(false);
      setGenerationStep("");
    }
  };

  // Save Deck to MongoDB
  const handleSaveDeck = async (targetDeck?: IDeck) => {
    const current = targetDeck || deck;
    if (!current) return;

    setSaveStatus("saving");
    try {
      const res = await fetch("/api/research/presentation/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentSessionId,
          title: current.title,
          topic,
          slideCount: current.slides.length,
          theme,
          tone,
          targetAudience,
          rawContent: content,
          slides: current.slides,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session?._id) {
          setCurrentSessionId(data.session._id);
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
        loadSessions();
      }
    } catch (e) {
      console.error("Failed to save session:", e);
      setSaveStatus("idle");
    }
  };

  // Load Session from History
  const handleSelectSession = (sess: IPresentationSession) => {
    setCurrentSessionId(sess._id);
    setTopic(sess.topic || sess.title);
    setContent(sess.rawContent || "");
    setSlideCount(sess.slideCount || sess.slides.length || 6);
    if (sess.theme && THEMES[sess.theme]) setTheme(sess.theme);
    if (sess.tone) setTone(sess.tone);
    if (sess.targetAudience) setTargetAudience(sess.targetAudience);

    setDeck({
      title: sess.title,
      subtitle: `Presentation for ${sess.targetAudience || "stakeholders"}`,
      slides: sess.slides,
    });
    setCurrentSlideIdx(0);
    setHistoryOpen(false);
  };

  // Delete Session
  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved presentation?")) return;

    try {
      const res = await fetch(`/api/research/presentation/sessions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (currentSessionId === id) setCurrentSessionId(null);
        setSessions((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // PPTX Export using pptxgenjs
  const handleExportPptx = async () => {
    if (!deck || deck.slides.length === 0) return;
    setExporting(true);

    try {
      const activeTheme = THEMES[theme] || THEMES.indigo;
      const pptx = new pptxgen();

      pptx.layout = "LAYOUT_16x9";
      pptx.author = "Agento AI Presentation Studio";
      pptx.company = "Agento";
      pptx.title = deck.title;

      deck.slides.forEach((s) => {
        const slide = pptx.addSlide();
        slide.background = { color: activeTheme.pptx.bg };

        // Presenter Notes
        if (s.presenterNotes) {
          slide.addNotes(s.presenterNotes);
        }

        const isTitle = s.layout === "title" || s.slideNumber === 1;

        if (isTitle) {
          // TITLE SLIDE
          // Decorative Top Accent Line
          slide.addShape(pptx.ShapeType.rect, {
            x: 0.8,
            y: 0.6,
            w: 1.2,
            h: 0.08,
            fill: { color: activeTheme.pptx.accent },
            line: { color: activeTheme.pptx.accent },
          });

          // Badge
          if (s.badge) {
            slide.addText(s.badge.toUpperCase(), {
              x: 0.8,
              y: 0.8,
              w: 5.0,
              h: 0.4,
              fontSize: 11,
              fontFace: activeTheme.pptx.font,
              color: activeTheme.pptx.accentLight,
              bold: true,
              charSpacing: 3,
            });
          }

          // Main Title
          slide.addText(s.title || deck.title, {
            x: 0.8,
            y: 1.5,
            w: 11.5,
            h: 2.2,
            fontSize: 36,
            fontFace: activeTheme.pptx.font,
            color: activeTheme.pptx.text,
            bold: true,
            valign: "top",
          });

          // Subtitle
          if (s.subtitle || deck.subtitle) {
            slide.addText(s.subtitle || deck.subtitle || "", {
              x: 0.8,
              y: 3.8,
              w: 11.5,
              h: 1.2,
              fontSize: 18,
              fontFace: activeTheme.pptx.font,
              color: activeTheme.pptx.subText,
              valign: "top",
            });
          }

          // Bottom card metadata
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 5.4,
            w: 11.5,
            h: 1.2,
            rectRadius: 0.15,
            fill: { color: activeTheme.pptx.cardBg },
            line: { color: activeTheme.pptx.accent, width: 1 },
          });

          const metaItems = (s.points && s.points.length > 0)
            ? s.points.join("   •   ")
            : `Generated by Agento AI   •   Target: ${targetAudience.toUpperCase()}   •   Tone: ${tone.toUpperCase()}`;

          slide.addText(metaItems, {
            x: 1.1,
            y: 5.7,
            w: 10.9,
            h: 0.6,
            fontSize: 12,
            fontFace: activeTheme.pptx.font,
            color: activeTheme.pptx.accentLight,
            bold: true,
          });
        } else if (s.layout === "stat-highlight" && s.stat?.value) {
          // STAT HIGHLIGHT SLIDE
          // Header Badge & Title
          if (s.badge) {
            slide.addText(s.badge.toUpperCase(), {
              x: 0.8,
              y: 0.6,
              w: 8.0,
              h: 0.35,
              fontSize: 10,
              fontFace: activeTheme.pptx.font,
              color: activeTheme.pptx.accentLight,
              bold: true,
              charSpacing: 2,
            });
          }

          slide.addText(s.title, {
            x: 0.8,
            y: 0.95,
            w: 10.5,
            h: 0.9,
            fontSize: 24,
            fontFace: activeTheme.pptx.font,
            color: activeTheme.pptx.text,
            bold: true,
          });

          // Left: Huge Stat Card
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 2.1,
            w: 4.2,
            h: 4.4,
            rectRadius: 0.2,
            fill: { color: activeTheme.pptx.cardBg },
            line: { color: activeTheme.pptx.accent, width: 1.5 },
          });

          slide.addText(s.stat.value, {
            x: 1.0,
            y: 2.6,
            w: 3.8,
            h: 1.6,
            fontSize: 54,
            fontFace: activeTheme.pptx.font,
            color: activeTheme.pptx.accentLight,
            bold: true,
            align: "center",
          });

          slide.addText(s.stat.label, {
            x: 1.1,
            y: 4.3,
            w: 3.6,
            h: 1.4,
            fontSize: 14,
            fontFace: activeTheme.pptx.font,
            color: activeTheme.pptx.text,
            align: "center",
            bold: true,
          });

          // Right: Content Card
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 5.3,
            y: 2.1,
            w: 7.0,
            h: 4.4,
            rectRadius: 0.2,
            fill: { color: activeTheme.pptx.cardBg },
            line: { color: activeTheme.pptx.accent, width: 0.5 },
          });

          if (s.points && s.points.length > 0) {
            const bulletItems = s.points.map((pt) => ({
              text: pt,
              options: {
                bullet: true,
                color: activeTheme.pptx.text,
                fontSize: 14,
                fontFace: activeTheme.pptx.font,
                spaceAfter: 16,
              },
            }));

            slide.addText(bulletItems, {
              x: 5.7,
              y: 2.5,
              w: 6.2,
              h: 3.6,
              valign: "top",
            });
          }
        } else if (s.layout === "two-column") {
          // TWO-COLUMN SLIDE
          if (s.badge) {
            slide.addText(s.badge.toUpperCase(), {
              x: 0.8,
              y: 0.6,
              w: 8.0,
              h: 0.35,
              fontSize: 10,
              fontFace: activeTheme.pptx.font,
              color: activeTheme.pptx.accentLight,
              bold: true,
              charSpacing: 2,
            });
          }

          slide.addText(s.title, {
            x: 0.8,
            y: 0.95,
            w: 11.5,
            h: 0.9,
            fontSize: 24,
            fontFace: activeTheme.pptx.font,
            color: activeTheme.pptx.text,
            bold: true,
          });

          // Left Column Card
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 2.1,
            w: 5.5,
            h: 4.4,
            rectRadius: 0.2,
            fill: { color: activeTheme.pptx.cardBg },
            line: { color: activeTheme.pptx.accent, width: 0.8 },
          });

          if (s.points && s.points.length > 0) {
            const leftBullets = s.points.map((pt) => ({
              text: pt,
              options: {
                bullet: true,
                color: activeTheme.pptx.text,
                fontSize: 13,
                fontFace: activeTheme.pptx.font,
                spaceAfter: 12,
              },
            }));
            slide.addText(leftBullets, {
              x: 1.1,
              y: 2.4,
              w: 4.9,
              h: 3.8,
              valign: "top",
            });
          }

          // Right Column Card
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 6.8,
            y: 2.1,
            w: 5.5,
            h: 4.4,
            rectRadius: 0.2,
            fill: { color: activeTheme.pptx.cardBg },
            line: { color: activeTheme.pptx.accent, width: 0.8 },
          });

          const rightPoints = (s.secondaryPoints && s.secondaryPoints.length > 0)
            ? s.secondaryPoints
            : (s.points?.slice(2) || []);

          if (rightPoints.length > 0) {
            const rightBullets = rightPoints.map((pt) => ({
              text: pt,
              options: {
                bullet: true,
                color: activeTheme.pptx.text,
                fontSize: 13,
                fontFace: activeTheme.pptx.font,
                spaceAfter: 12,
              },
            }));
            slide.addText(rightBullets, {
              x: 7.1,
              y: 2.4,
              w: 4.9,
              h: 3.8,
              valign: "top",
            });
          }
        } else {
          // STANDARD / CONCLUSION / BULLETS SLIDE
          if (s.badge) {
            slide.addText(s.badge.toUpperCase(), {
              x: 0.8,
              y: 0.6,
              w: 8.0,
              h: 0.35,
              fontSize: 10,
              fontFace: activeTheme.pptx.font,
              color: activeTheme.pptx.accentLight,
              bold: true,
              charSpacing: 2,
            });
          }

          slide.addText(s.title, {
            x: 0.8,
            y: 0.95,
            w: 11.5,
            h: 0.9,
            fontSize: 24,
            fontFace: activeTheme.pptx.font,
            color: activeTheme.pptx.text,
            bold: true,
          });

          if (s.subtitle) {
            slide.addText(s.subtitle, {
              x: 0.8,
              y: 1.7,
              w: 11.5,
              h: 0.4,
              fontSize: 13,
              fontFace: activeTheme.pptx.font,
              color: activeTheme.pptx.subText,
            });
          }

          // Main Content Card
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 2.2,
            w: 11.5,
            h: 4.3,
            rectRadius: 0.2,
            fill: { color: activeTheme.pptx.cardBg },
            line: { color: activeTheme.pptx.accent, width: 0.8 },
          });

          if (s.points && s.points.length > 0) {
            const bullets = s.points.map((pt) => ({
              text: pt,
              options: {
                bullet: true,
                color: activeTheme.pptx.text,
                fontSize: 14,
                fontFace: activeTheme.pptx.font,
                spaceAfter: 16,
              },
            }));

            slide.addText(bullets, {
              x: 1.2,
              y: 2.5,
              w: 10.7,
              h: 3.5,
              valign: "top",
            });
          }

          if (s.quote) {
            slide.addText(`“${s.quote}”`, {
              x: 1.2,
              y: 5.5,
              w: 10.7,
              h: 0.8,
              fontSize: 12,
              fontFace: activeTheme.pptx.font,
              color: activeTheme.pptx.accentLight,
              italic: true,
            });
          }
        }

        // Slide Number Footer
        slide.addText(`${s.slideNumber} / ${deck.slides.length}`, {
          x: 11.5,
          y: 6.8,
          w: 1.2,
          h: 0.3,
          fontSize: 9,
          fontFace: activeTheme.pptx.font,
          color: activeTheme.pptx.subText,
          align: "right",
        });

        // Agento Watermark Footer
        slide.addText("Generated by Agento AI", {
          x: 0.8,
          y: 6.8,
          w: 4.0,
          h: 0.3,
          fontSize: 9,
          fontFace: activeTheme.pptx.font,
          color: activeTheme.pptx.subText,
        });
      });

      const fileName = `${(deck.title || "Presentation").replace(/[^a-zA-Z0-9_-]/g, "_")}.pptx`;
      await pptx.writeFile({ fileName });
    } catch (err) {
      console.error("PPTX export error:", err);
      alert("Failed to export PowerPoint file. Please check console.");
    } finally {
      setExporting(false);
    }
  };

  // Copy Outline
  const handleCopyOutline = () => {
    if (!deck) return;
    let text = `# ${deck.title}\n${deck.subtitle || ""}\n\n`;
    deck.slides.forEach((s) => {
      text += `## Slide ${s.slideNumber}: ${s.title}\n`;
      if (s.subtitle) text += `*${s.subtitle}*\n`;
      if (s.points) {
        s.points.forEach((p) => {
          text += `- ${p}\n`;
        });
      }
      if (s.secondaryPoints) {
        s.secondaryPoints.forEach((p) => {
          text += `  - ${p}\n`;
        });
      }
      if (s.stat) text += `> Metric: **${s.stat.value}** (${s.stat.label})\n`;
      if (s.quote) text += `> Quote: *${s.quote}*\n`;
      if (s.presenterNotes) text += `\n*Presenter Notes:* ${s.presenterNotes}\n`;
      text += "\n---\n\n";
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Inline Slide Editing Helpers
  const updateSlideField = (index: number, field: keyof ISlide, value: any) => {
    if (!deck) return;
    const updated = [...deck.slides];
    updated[index] = { ...updated[index], [field]: value };
    setDeck({ ...deck, slides: updated });
  };

  const updateSlidePoint = (slideIdx: number, pointIdx: number, value: string) => {
    if (!deck) return;
    const updatedSlides = [...deck.slides];
    const points = [...(updatedSlides[slideIdx].points || [])];
    points[pointIdx] = value;
    updatedSlides[slideIdx] = { ...updatedSlides[slideIdx], points };
    setDeck({ ...deck, slides: updatedSlides });
  };

  const addSlidePoint = (slideIdx: number) => {
    if (!deck) return;
    const updatedSlides = [...deck.slides];
    const points = [...(updatedSlides[slideIdx].points || []), "New strategic point"];
    updatedSlides[slideIdx] = { ...updatedSlides[slideIdx], points };
    setDeck({ ...deck, slides: updatedSlides });
  };

  const removeSlidePoint = (slideIdx: number, pointIdx: number) => {
    if (!deck) return;
    const updatedSlides = [...deck.slides];
    const points = (updatedSlides[slideIdx].points || []).filter((_, idx) => idx !== pointIdx);
    updatedSlides[slideIdx] = { ...updatedSlides[slideIdx], points };
    setDeck({ ...deck, slides: updatedSlides });
  };

  const addSlide = () => {
    if (!deck) return;
    const newSlide: ISlide = {
      slideNumber: deck.slides.length + 1,
      title: "New Topic Section",
      subtitle: "Strategic insights & priorities",
      badge: "Strategy",
      layout: "bullets",
      points: ["High-impact initiative description", "Operational enhancement and scale", "Key milestone and deliverable"],
      presenterNotes: "Elaborate on this newly added strategic section.",
    };
    const updated = [...deck.slides, newSlide];
    setDeck({ ...deck, slides: updated });
    setCurrentSlideIdx(updated.length - 1);
  };

  const deleteCurrentSlide = (idx: number) => {
    if (!deck || deck.slides.length <= 1) return;
    const updated = deck.slides
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, slideNumber: i + 1 }));
    setDeck({ ...deck, slides: updated });
    setCurrentSlideIdx((prev) => Math.min(prev, updated.length - 1));
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const activeTheme = THEMES[theme] || THEMES.indigo;
  const currentSlide = deck?.slides[currentSlideIdx];

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[160px] bg-emerald-900/20 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full blur-[160px] bg-indigo-900/20 pointer-events-none" />

      {/* Top Navigation */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="Agento" width={90} height={50} className="opacity-90" />
          <div className="h-5 w-px bg-slate-800" />
          <button
            onClick={() => router.push("/research")}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Research Suite
          </button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Presentation className="w-3.5 h-3.5" /> AI Presentation Studio
          </div>
        </div>

        <div className="flex items-center gap-3">
          {deck && (
            <>
              {/* Save Status Badge */}
              <button
                onClick={() => handleSaveDeck()}
                disabled={saveStatus === "saving"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                title="Save deck to cloud history"
              >
                {saveStatus === "saving" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : saveStatus === "saved" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{saveStatus === "saved" ? "Saved" : "Save Deck"}</span>
              </button>

              {/* Copy Outline */}
              <button
                onClick={handleCopyOutline}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                title="Copy Markdown Outline"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy Outline"}</span>
              </button>

              {/* Download PPTX */}
              <button
                onClick={handleExportPptx}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 cursor-pointer transition-all disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download .pptx</span>
              </button>
            </>
          )}

          {/* History Drawer Toggle */}
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 cursor-pointer transition-colors"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">History</span>
            {sessions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] text-emerald-400 font-bold">
                {sessions.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Input Configuration Panel */}
        <aside className="w-full lg:w-[420px] xl:w-[450px] border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 overflow-y-auto flex flex-col gap-5 shrink-0">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Deck Configuration
              </h2>
              {deck && (
                <button
                  onClick={() => {
                    setDeck(null);
                    setCurrentSessionId(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  + New Deck
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Provide your topic, lecture notes, or upload a document to generate formatted slides.
            </p>
          </div>

          {/* Presentation Topic */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Presentation Topic / Title</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AI Strategy for Q3 2026, Blockchain Architecture..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Content / Notes Area with File Upload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Raw Notes / Source Content</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3" /> Upload PDF / TXT
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Paste article, meeting summary, lecture notes, bullet points, or document excerpt here..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none font-mono"
            />
          </div>

          {/* Slide Count Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Number of Slides</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                {slideCount} Slides
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SLIDE_PRESETS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setSlideCount(count)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    slideCount === count
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Palette Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-400" /> Design Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(THEMES).map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setTheme(th.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    theme === th.id
                      ? "border-emerald-500 bg-slate-800 text-white shadow-sm ring-1 ring-emerald-500/50"
                      : "border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${th.accent} shrink-0`} />
                  <span className="truncate font-medium">{th.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone & Audience */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {TONES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {AUDIENCES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle: Include Presenter Notes */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-emerald-400" /> Include Presenter Notes
            </span>
            <input
              type="checkbox"
              checked={includeNotes}
              onChange={(e) => setIncludeNotes(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-600 hover:via-teal-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-emerald-950/50 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Presentation...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{deck ? "Regenerate Presentation" : "Generate Slide Deck"}</span>
              </>
            )}
          </button>

          {/* Loading Animation & Step */}
          {loading && (
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Agent in Progress:</span>
              </div>
              <p className="text-slate-300">{generationStep}</p>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full w-3/4 animate-pulse" />
              </div>
            </div>
          )}
        </aside>

        {/* Right Stage: Presentation Preview Studio */}
        <section className="flex-1 flex flex-col bg-slate-950 p-6 overflow-y-auto">
          {!deck ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto p-8 rounded-3xl border border-dashed border-slate-800 bg-slate-900/30">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 mb-4 text-emerald-400">
                <Presentation className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ready to Build Your Slide Deck</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Enter your presentation topic or paste source notes on the left, select your theme and slide count, then click Generate.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
                  ✨ Native .pptx Download
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
                  🖥️ 16:9 Interactive Player
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
                  ✏️ Inline Slide Editor
                </span>
              </div>
            </div>
          ) : (
            /* Active Deck Workspace */
            <div className="flex-1 flex flex-col gap-4 max-w-5xl mx-auto w-full">
              {/* Studio Toolbar */}
              <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                    <button
                      onClick={() => setViewMode("player")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        viewMode === "player" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Play className="w-3 h-3" /> Player
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        viewMode === "grid" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <LayoutGrid className="w-3 h-3" /> All Slides
                    </button>
                  </div>

                  {/* Edit Mode Toggle */}
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                      isEditing
                        ? "bg-amber-500/20 border-amber-500 text-amber-300"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditing ? "Done Editing" : "Edit Slide"}</span>
                  </button>

                  <button
                    onClick={addSlide}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" /> Add Slide
                  </button>
                </div>

                {/* Navigation Counter & Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    Slide <strong className="text-white">{currentSlideIdx + 1}</strong> of {deck.slides.length}
                  </span>
                  <button
                    onClick={() => setCurrentSlideIdx((prev) => Math.max(prev - 1, 0))}
                    disabled={currentSlideIdx === 0}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentSlideIdx((prev) => Math.min(prev + 1, deck.slides.length - 1))}
                    disabled={currentSlideIdx === deck.slides.length - 1}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer ml-1"
                    title="Fullscreen Presentation (or Ctrl+F)"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* View 1: 16:9 Interactive Deck Player */}
              {viewMode === "player" && currentSlide && (
                <div className="flex flex-col gap-4">
                  {/* 16:9 Canvas Slide Card */}
                  <div
                    ref={playerRef}
                    className={`relative w-full aspect-[16/9] rounded-3xl p-8 md:p-12 shadow-2xl border flex flex-col justify-between overflow-hidden transition-all duration-300 ${activeTheme.bgClass} ${
                      isFullscreen ? "p-16" : ""
                    }`}
                  >
                    {/* Decorative Top Accent Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${activeTheme.accent}`} />

                    {/* Top Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Slide Badge / Step */}
                        {isEditing ? (
                          <input
                            type="text"
                            value={currentSlide.badge || ""}
                            onChange={(e) => updateSlideField(currentSlideIdx, "badge", e.target.value)}
                            placeholder="Category Badge"
                            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-white focus:outline-none"
                          />
                        ) : (
                          currentSlide.badge && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${activeTheme.badgeClass}`}>
                              {currentSlide.badge}
                            </span>
                          )
                        )}
                      </div>

                      <span className="text-xs font-mono opacity-50">
                        {currentSlide.slideNumber} / {deck.slides.length}
                      </span>
                    </div>

                    {/* Middle Content Area */}
                    <div className="my-auto flex flex-col justify-center">
                      {/* Slide Title */}
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentSlide.title}
                          onChange={(e) => updateSlideField(currentSlideIdx, "title", e.target.value)}
                          className="w-full text-2xl md:text-3xl font-black bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-white mb-2 focus:outline-none"
                        />
                      ) : (
                        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2 leading-tight">
                          {currentSlide.title}
                        </h2>
                      )}

                      {/* Subtitle */}
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentSlide.subtitle || ""}
                          onChange={(e) => updateSlideField(currentSlideIdx, "subtitle", e.target.value)}
                          placeholder="Subtitle (optional)"
                          className="w-full text-sm bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1 text-slate-300 mb-6 focus:outline-none"
                        />
                      ) : (
                        currentSlide.subtitle && (
                          <p className="text-sm md:text-base opacity-75 mb-6 font-medium">
                            {currentSlide.subtitle}
                          </p>
                        )
                      )}

                      {/* Layout Variations */}
                      {currentSlide.layout === "stat-highlight" && currentSlide.stat?.value ? (
                        /* Stat Highlight Layout */
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                          <div className={`p-6 rounded-2xl border text-center ${activeTheme.cardClass}`}>
                            <div className={`text-4xl md:text-5xl font-black mb-2 ${activeTheme.textClass}`}>
                              {currentSlide.stat.value}
                            </div>
                            <div className="text-xs md:text-sm font-semibold opacity-90">
                              {currentSlide.stat.label}
                            </div>
                          </div>

                          <div className={`md:col-span-2 p-6 rounded-2xl border ${activeTheme.cardClass} space-y-2.5`}>
                            {(currentSlide.points || []).map((pt, pIdx) => (
                              <div key={pIdx} className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 bg-gradient-to-r ${activeTheme.accent}`} />
                                {isEditing ? (
                                  <div className="flex-1 flex gap-2">
                                    <input
                                      type="text"
                                      value={pt}
                                      onChange={(e) => updateSlidePoint(currentSlideIdx, pIdx, e.target.value)}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                    />
                                    <button
                                      onClick={() => removeSlidePoint(currentSlideIdx, pIdx)}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-sm md:text-base leading-relaxed">{pt}</p>
                                )}
                              </div>
                            ))}
                            {isEditing && (
                              <button
                                onClick={() => addSlidePoint(currentSlideIdx)}
                                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 mt-2"
                              >
                                <Plus className="w-3 h-3" /> Add bullet point
                              </button>
                            )}
                          </div>
                        </div>
                      ) : currentSlide.layout === "two-column" ? (
                        /* Two Column Layout */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className={`p-5 rounded-2xl border ${activeTheme.cardClass} space-y-2.5`}>
                            {(currentSlide.points || []).map((pt, pIdx) => (
                              <div key={pIdx} className="flex items-start gap-2.5">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 bg-gradient-to-r ${activeTheme.accent}`} />
                                <p className="text-xs md:text-sm leading-relaxed">{pt}</p>
                              </div>
                            ))}
                          </div>
                          <div className={`p-5 rounded-2xl border ${activeTheme.cardClass} space-y-2.5`}>
                            {(currentSlide.secondaryPoints || currentSlide.points?.slice(2) || []).map((pt, pIdx) => (
                              <div key={pIdx} className="flex items-start gap-2.5">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 bg-gradient-to-r ${activeTheme.accent}`} />
                                <p className="text-xs md:text-sm leading-relaxed">{pt}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Standard Bullets & Cards Layout */
                        <div className={`p-6 rounded-2xl border ${activeTheme.cardClass} space-y-3`}>
                          {(currentSlide.points || []).map((pt, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-gradient-to-r ${activeTheme.accent}`} />
                              {isEditing ? (
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={pt}
                                    onChange={(e) => updateSlidePoint(currentSlideIdx, pIdx, e.target.value)}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                                  />
                                  <button
                                    onClick={() => removeSlidePoint(currentSlideIdx, pIdx)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <p className="text-sm md:text-base leading-relaxed">{pt}</p>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <button
                              onClick={() => addSlidePoint(currentSlideIdx)}
                              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 mt-2"
                            >
                              <Plus className="w-3 h-3" /> Add bullet point
                            </button>
                          )}
                        </div>
                      )}

                      {/* Optional Quote / Takeaway Footer */}
                      {currentSlide.quote && (
                        <div className="mt-4 flex items-center gap-2 text-xs italic opacity-80">
                          <Quote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>“{currentSlide.quote}”</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Slide Footer */}
                    <div className="flex items-center justify-between text-[11px] opacity-40 font-mono pt-4 border-t border-white/10">
                      <span>Agento AI • {deck.title}</span>
                      <span>Confidential & Proprietary</span>
                    </div>
                  </div>

                  {/* Presenter Speaker Notes Drawer */}
                  {currentSlide.presenterNotes && (
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5" /> Presenter Speech Cue
                        </span>
                        {isEditing && <span className="text-slate-500 font-normal">Editable</span>}
                      </div>
                      {isEditing ? (
                        <textarea
                          value={currentSlide.presenterNotes}
                          onChange={(e) => updateSlideField(currentSlideIdx, "presenterNotes", e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none"
                          rows={2}
                        />
                      ) : (
                        <p className="text-slate-300 leading-relaxed font-sans">{currentSlide.presenterNotes}</p>
                      )}
                    </div>
                  )}

                  {/* Thumbnails Filmstrip Carousel */}
                  <div className="flex items-center gap-3 overflow-x-auto py-2 px-1">
                    {deck.slides.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIdx(idx)}
                        className={`group relative shrink-0 w-36 aspect-[16/9] rounded-xl border p-2 text-left transition-all cursor-pointer overflow-hidden ${
                          currentSlideIdx === idx
                            ? "border-emerald-500 ring-2 ring-emerald-500/50 bg-slate-800"
                            : "border-slate-800 bg-slate-900/80 hover:border-slate-700 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
                          <span>Slide {s.slideNumber}</span>
                          {s.badge && <span className="truncate max-w-[50px]">{s.badge}</span>}
                        </div>
                        <p className="text-[11px] font-bold text-white truncate">{s.title}</p>
                        <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                          {s.points?.[0] || s.subtitle || ""}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* View 2: All Slides Grid */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                  {deck.slides.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setCurrentSlideIdx(idx);
                        setViewMode("player");
                      }}
                      className="group relative aspect-[16/9] rounded-2xl p-5 border border-slate-800 bg-slate-900/80 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-emerald-400">
                          {s.badge || `Slide ${s.slideNumber}`}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCurrentSlide(idx);
                            }}
                            className="p-1 rounded bg-red-950/80 text-red-400 hover:text-red-300"
                            title="Delete slide"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="my-auto">
                        <h4 className="text-sm md:text-base font-bold text-white mb-1">{s.title}</h4>
                        {s.subtitle && <p className="text-xs text-slate-400 line-clamp-1 mb-2">{s.subtitle}</p>}
                        <ul className="text-xs text-slate-300 space-y-1">
                          {(s.points || []).slice(0, 2).map((pt, pIdx) => (
                            <li key={pIdx} className="line-clamp-1 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Layout: {s.layout || "bullets"}</span>
                        <span>Click to open in player →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* History Sidebar */}
        {historyOpen && (
          <aside className="w-80 border-l border-slate-800 bg-slate-900/90 backdrop-blur-xl p-5 flex flex-col justify-between shrink-0 z-30">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" /> Saved Presentations
                </h3>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-emerald-400" />
                  Loading past decks...
                </div>
              ) : sessions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No saved presentations yet.
                </div>
              ) : (
                <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-200px)]">
                  {sessions.map((s) => (
                    <div
                      key={s._id}
                      onClick={() => handleSelectSession(s)}
                      className={`group p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        currentSessionId === s._id
                          ? "border-emerald-500 bg-slate-800/90"
                          : "border-slate-800 bg-slate-900 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase text-emerald-400">
                          {s.slideCount || s.slides?.length || 0} Slides
                        </span>
                        <button
                          onClick={(e) => handleDeleteSession(s._id, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity p-1"
                          title="Delete session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs font-bold text-white truncate mb-1">{s.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(s.updatedAt || s.createdAt).toLocaleDateString()} • {s.theme}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-500 text-center pt-4 border-t border-slate-800">
              Decks are saved automatically to your workspace account.
            </p>
          </aside>
        )}
      </div>
    </main>
  );
}
