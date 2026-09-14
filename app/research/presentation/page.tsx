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
  FileCode, Palette, Users, Mic, Quote, TrendingUp, MonitorPlay
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
  previewBg: string;
  slideBg: string;
  slideCard: string;
  slideText: string;
  slideSubText: string;
  badgeStyle: string;
  dotColor: string;
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
  emerald: {
    id: "emerald",
    name: "Emerald Growth",
    accent: "from-emerald-500 to-teal-600",
    previewBg: "bg-emerald-500",
    slideBg: "bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white",
    slideCard: "bg-slate-800/80 border-emerald-500/30 text-slate-100",
    slideText: "text-white",
    slideSubText: "text-emerald-300/80",
    badgeStyle: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dotColor: "bg-emerald-400",
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
  indigo: {
    id: "indigo",
    name: "Modern Indigo",
    accent: "from-indigo-600 to-violet-600",
    previewBg: "bg-indigo-600",
    slideBg: "bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white",
    slideCard: "bg-slate-800/80 border-indigo-500/30 text-slate-100",
    slideText: "text-white",
    slideSubText: "text-indigo-300/80",
    badgeStyle: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    dotColor: "bg-indigo-400",
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
  clean: {
    id: "clean",
    name: "Nordic Clean",
    accent: "from-slate-700 to-slate-900",
    previewBg: "bg-slate-200 border border-slate-300",
    slideBg: "bg-white text-slate-900",
    slideCard: "bg-slate-50 border-slate-200 text-slate-800",
    slideText: "text-slate-900",
    slideSubText: "text-slate-500",
    badgeStyle: "bg-slate-100 text-slate-700 border-slate-200",
    dotColor: "bg-slate-900",
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
  corporate: {
    id: "corporate",
    name: "Royal Navy",
    accent: "from-blue-600 to-indigo-800",
    previewBg: "bg-blue-700",
    slideBg: "bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white",
    slideCard: "bg-slate-900/90 border-blue-500/30 text-slate-100",
    slideText: "text-white",
    slideSubText: "text-blue-300/80",
    badgeStyle: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    dotColor: "bg-blue-400",
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
    name: "Sunset Coral",
    accent: "from-amber-500 via-rose-500 to-purple-600",
    previewBg: "bg-rose-500",
    slideBg: "bg-gradient-to-br from-neutral-950 via-neutral-900 to-rose-950 text-white",
    slideCard: "bg-neutral-800/90 border-rose-500/30 text-neutral-100",
    slideText: "text-white",
    slideSubText: "text-rose-300/80",
    badgeStyle: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    dotColor: "bg-rose-400",
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
  const [theme, setTheme] = useState("emerald");
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
      setGenerationStep("Extracting text from document...");
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
      alert("Please provide a presentation topic or paste content/notes to generate slides.");
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
      const activeTheme = THEMES[theme] || THEMES.emerald;
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
          slide.addShape(pptx.ShapeType.rect, {
            x: 0.8,
            y: 0.6,
            w: 1.2,
            h: 0.08,
            fill: { color: activeTheme.pptx.accent },
            line: { color: activeTheme.pptx.accent },
          });

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
    const points = [...(updatedSlides[slideIdx].points || []), "New strategic priority point"];
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
      title: "Strategic Section Focus",
      subtitle: "Operational insights & deliverables",
      badge: "Strategy",
      layout: "bullets",
      points: ["Core strategic initiative description", "Operational enhancement and scale", "Key milestone and expected deliverable"],
      presenterNotes: "Discuss this strategic section with the audience.",
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

  const activeTheme = THEMES[theme] || THEMES.emerald;
  const currentSlide = deck?.slides[currentSlideIdx];

  return (
    <main className="h-screen flex flex-col bg-slate-50 overflow-hidden" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
      {/* ── Ambient Backgrounds (consistent with Agento design system) ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-emerald-50/50 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[140px] bg-emerald-200/30 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full blur-[130px] bg-indigo-200/20 pointer-events-none" />

      {/* ── Header ── */}
      <header className="relative z-20 flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-slate-200/70 bg-white/70 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/research")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
              <Presentation className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">AI Presentation Generator</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {deck && (
            <>
              {/* Save Status Badge */}
              <button
                onClick={() => handleSaveDeck()}
                disabled={saveStatus === "saving"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors"
                title="Save presentation to database"
              >
                {saveStatus === "saving" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : saveStatus === "saved" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{saveStatus === "saved" ? "Saved" : "Save Deck"}</span>
              </button>

              {/* Copy Outline */}
              <button
                onClick={handleCopyOutline}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors"
                title="Copy Markdown Outline"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy Outline"}</span>
              </button>

              {/* Download PPTX */}
              <button
                onClick={handleExportPptx}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm cursor-pointer transition-all disabled:opacity-50"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">History</span>
            {sessions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-[10px] text-emerald-700 font-bold">
                {sessions.length}
              </span>
            )}
          </button>

          <Image src="/logo.png" alt="Agento" width={80} height={48} className="opacity-80" />
        </div>
      </header>

      {/* ── Two-Column Workspace ── */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* ══════════════════════════════════════
            LEFT - Input Configuration Studio
        ══════════════════════════════════════ */}
        <div className="w-[390px] xl:w-[410px] flex-shrink-0 flex flex-col border-r border-slate-200/70 bg-white/70 backdrop-blur-md overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Header Section */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" /> Presentation Parameters
              </span>
              {deck && (
                <button
                  onClick={() => {
                    setDeck(null);
                    setCurrentSessionId(null);
                  }}
                  className="text-[11px] text-emerald-600 hover:underline cursor-pointer font-medium"
                >
                  + New Deck
                </button>
              )}
            </div>

            {/* Presentation Topic */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Presentation Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Enterprise AI Strategy, Product Launch Deck..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
              />
            </div>

            {/* Raw Notes / Content with Upload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Source Notes / Raw Content</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer font-medium"
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
                placeholder="Paste key points, lecture notes, meeting summary, or product pitch outline here..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none shadow-sm"
              />
            </div>

            {/* Slide Count Selector */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Slide Count</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                  {slideCount} Slides
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SLIDE_PRESETS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setSlideCount(count)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      slideCount === count
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Theme Swatches */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-emerald-600" /> Deck Theme
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.values(THEMES).map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setTheme(th.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      theme === th.id
                        ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-sm font-semibold"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full ${th.previewBg} shrink-0`} />
                    <span className="truncate">{th.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone & Audience Selectors */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
                >
                  {TONES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
                >
                  {AUDIENCES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Presenter Notes Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-600 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-600" /> Presenter Notes
              </span>
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 bg-slate-100 border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Action Footer Button */}
          <div className="p-4 border-t border-slate-200/70 bg-white/90">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Presentation...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{deck ? "Regenerate Slides" : "Generate Slide Deck"}</span>
                </>
              )}
            </button>

            {loading && (
              <p className="text-[11px] text-slate-500 text-center mt-2 animate-pulse">
                {generationStep}
              </p>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════
            RIGHT - Presentation Preview Canvas
        ══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6">
          {!deck ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto p-8 rounded-2xl border border-dashed border-slate-200 bg-white/60 shadow-sm">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 mb-3 text-emerald-600">
                <Presentation className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Generate Your Presentation</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-5">
                Configure your topic, slide count, and theme on the left to generate an executive slide deck with PowerPoint (.pptx) download.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-600">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                  ⚡ 16:9 Live Preview
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                  📁 PowerPoint (.pptx)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                  ✏️ Inline Slide Editor
                </span>
              </div>
            </div>
          ) : (
            /* Active Presentation Studio */
            <div className="flex-1 flex flex-col gap-4 max-w-5xl mx-auto w-full">
              {/* Studio Toolbar Header */}
              <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                <div className="flex items-center gap-2.5">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setViewMode("player")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        viewMode === "player" ? "bg-white text-emerald-700 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Play className="w-3 h-3" /> Player
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        viewMode === "grid" ? "bg-white text-emerald-700 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <LayoutGrid className="w-3 h-3" /> Grid View
                    </button>
                  </div>

                  {/* Edit Mode Toggle */}
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                      isEditing
                        ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Edit3 className="w-3 h-3 text-amber-600" />
                    <span>{isEditing ? "Done Editing" : "Edit Slide"}</span>
                  </button>

                  <button
                    onClick={addSlide}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" /> Add Slide
                  </button>
                </div>

                {/* Player Navigation & Counter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">
                    Slide <strong className="text-slate-900">{currentSlideIdx + 1}</strong> / {deck.slides.length}
                  </span>
                  <button
                    onClick={() => setCurrentSlideIdx((prev) => Math.max(prev - 1, 0))}
                    disabled={currentSlideIdx === 0}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentSlideIdx((prev) => Math.min(prev + 1, deck.slides.length - 1))}
                    disabled={currentSlideIdx === deck.slides.length - 1}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer ml-1"
                    title="Fullscreen Mode"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* View 1: 16:9 Interactive Deck Player */}
              {viewMode === "player" && currentSlide && (
                <div className="flex flex-col gap-4">
                  {/* 16:9 Aspect Ratio Slide Presentation Card */}
                  <div
                    ref={playerRef}
                    className={`relative w-full aspect-[16/9] rounded-2xl p-8 md:p-12 shadow-xl border flex flex-col justify-between overflow-hidden transition-all duration-300 ${activeTheme.slideBg} ${
                      isFullscreen ? "p-16" : ""
                    }`}
                  >
                    {/* Decorative Top Line */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${activeTheme.accent}`} />

                    {/* Slide Top Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={currentSlide.badge || ""}
                            onChange={(e) => updateSlideField(currentSlideIdx, "badge", e.target.value)}
                            placeholder="Category Badge"
                            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 border border-white/30 text-white focus:outline-none"
                          />
                        ) : (
                          currentSlide.badge && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${activeTheme.badgeStyle}`}>
                              {currentSlide.badge}
                            </span>
                          )
                        )}
                      </div>

                      <span className="text-xs font-mono opacity-60">
                        {currentSlide.slideNumber} / {deck.slides.length}
                      </span>
                    </div>

                    {/* Middle Content Section */}
                    <div className="my-auto flex flex-col justify-center">
                      {/* Slide Title */}
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentSlide.title}
                          onChange={(e) => updateSlideField(currentSlideIdx, "title", e.target.value)}
                          className="w-full text-2xl md:text-3xl font-extrabold bg-white/10 border border-white/30 rounded-lg px-3 py-1.5 text-white mb-2 focus:outline-none"
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
                          className="w-full text-sm bg-white/10 border border-white/30 rounded-lg px-3 py-1 text-white mb-6 focus:outline-none"
                        />
                      ) : (
                        currentSlide.subtitle && (
                          <p className={`text-sm md:text-base mb-6 font-medium ${activeTheme.slideSubText}`}>
                            {currentSlide.subtitle}
                          </p>
                        )
                      )}

                      {/* Layout Type Variations */}
                      {currentSlide.layout === "stat-highlight" && currentSlide.stat?.value ? (
                        /* Stat Highlight Card */
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                          <div className={`p-6 rounded-2xl border text-center ${activeTheme.slideCard}`}>
                            <div className="text-4xl md:text-5xl font-black mb-2 text-emerald-400">
                              {currentSlide.stat.value}
                            </div>
                            <div className="text-xs md:text-sm font-semibold opacity-90">
                              {currentSlide.stat.label}
                            </div>
                          </div>

                          <div className={`md:col-span-2 p-6 rounded-2xl border ${activeTheme.slideCard} space-y-2.5`}>
                            {(currentSlide.points || []).map((pt, pIdx) => (
                              <div key={pIdx} className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${activeTheme.dotColor}`} />
                                {isEditing ? (
                                  <div className="flex-1 flex gap-2">
                                    <input
                                      type="text"
                                      value={pt}
                                      onChange={(e) => updateSlidePoint(currentSlideIdx, pIdx, e.target.value)}
                                      className="flex-1 bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white"
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
                        /* Two Column Cards */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className={`p-5 rounded-2xl border ${activeTheme.slideCard} space-y-2.5`}>
                            {(currentSlide.points || []).map((pt, pIdx) => (
                              <div key={pIdx} className="flex items-start gap-2.5">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activeTheme.dotColor}`} />
                                <p className="text-xs md:text-sm leading-relaxed">{pt}</p>
                              </div>
                            ))}
                          </div>
                          <div className={`p-5 rounded-2xl border ${activeTheme.slideCard} space-y-2.5`}>
                            {(currentSlide.secondaryPoints || currentSlide.points?.slice(2) || []).map((pt, pIdx) => (
                              <div key={pIdx} className="flex items-start gap-2.5">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activeTheme.dotColor}`} />
                                <p className="text-xs md:text-sm leading-relaxed">{pt}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Standard Bullets Card */
                        <div className={`p-6 rounded-2xl border ${activeTheme.slideCard} space-y-3`}>
                          {(currentSlide.points || []).map((pt, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${activeTheme.dotColor}`} />
                              {isEditing ? (
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={pt}
                                    onChange={(e) => updateSlidePoint(currentSlideIdx, pIdx, e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/20 rounded px-2.5 py-1 text-xs text-white"
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

                      {/* Optional Quote Callout */}
                      {currentSlide.quote && (
                        <div className="mt-4 flex items-center gap-2 text-xs italic opacity-85">
                          <Quote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>“{currentSlide.quote}”</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Slide Footer */}
                    <div className="flex items-center justify-between text-[11px] opacity-50 font-mono pt-4 border-t border-white/10">
                      <span>Agento AI • {deck.title}</span>
                      <span>Confidential</span>
                    </div>
                  </div>

                  {/* Speaker Notes */}
                  {currentSlide.presenterNotes && (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs shadow-sm">
                      <div className="flex items-center justify-between text-emerald-700 font-semibold mb-1">
                        <span className="flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5" /> Presenter Notes
                        </span>
                        {isEditing && <span className="text-slate-400 font-normal">Editable</span>}
                      </div>
                      {isEditing ? (
                        <textarea
                          value={currentSlide.presenterNotes}
                          onChange={(e) => updateSlideField(currentSlideIdx, "presenterNotes", e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
                          rows={2}
                        />
                      ) : (
                        <p className="text-slate-600 leading-relaxed font-sans">{currentSlide.presenterNotes}</p>
                      )}
                    </div>
                  )}

                  {/* Slide Carousel Strip */}
                  <div className="flex items-center gap-3 overflow-x-auto py-2 px-1">
                    {deck.slides.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIdx(idx)}
                        className={`group relative shrink-0 w-36 aspect-[16/9] rounded-xl border p-2 text-left transition-all cursor-pointer overflow-hidden ${
                          currentSlideIdx === idx
                            ? "border-emerald-500 ring-2 ring-emerald-500/40 bg-white shadow-md"
                            : "border-slate-200 bg-white hover:border-slate-300 opacity-80 hover:opacity-100 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-0.5">
                          <span className="font-bold text-slate-700">Slide {s.slideNumber}</span>
                          {s.badge && <span className="truncate max-w-[45px] text-emerald-600">{s.badge}</span>}
                        </div>
                        <p className="text-[11px] font-bold text-slate-900 truncate">{s.title}</p>
                        <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
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
                      className="group relative aspect-[16/9] rounded-2xl p-5 border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                          {s.badge || `Slide ${s.slideNumber}`}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCurrentSlide(idx);
                            }}
                            className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                            title="Delete slide"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="my-auto">
                        <h4 className="text-sm font-bold text-slate-900 mb-1">{s.title}</h4>
                        {s.subtitle && <p className="text-xs text-slate-500 line-clamp-1 mb-2">{s.subtitle}</p>}
                        <ul className="text-xs text-slate-600 space-y-1">
                          {(s.points || []).slice(0, 2).map((pt, pIdx) => (
                            <li key={pIdx} className="line-clamp-1 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Layout: {s.layout || "bullets"}</span>
                        <span className="text-emerald-600 font-sans font-medium">Open in Player →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── History Drawer Sidebar ── */}
        {historyOpen && (
          <aside className="w-80 border-l border-slate-200 bg-white/95 backdrop-blur-xl p-5 flex flex-col justify-between shrink-0 z-30 shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" /> Saved Presentations
                </h3>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-emerald-600" />
                  Loading past decks...
                </div>
              ) : sessions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
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
                          ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase text-emerald-700">
                          {s.slideCount || s.slides?.length || 0} Slides
                        </span>
                        <button
                          onClick={(e) => handleDeleteSession(s._id, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity p-1"
                          title="Delete session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate mb-1">{s.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(s.updatedAt || s.createdAt).toLocaleDateString()} • {s.theme}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400 text-center pt-3 border-t border-slate-200">
              Saved automatically to your workspace account.
            </p>
          </aside>
        )}
      </div>
    </main>
  );
}
