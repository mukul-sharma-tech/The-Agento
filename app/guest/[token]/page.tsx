"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Send, Bot, User, Zap, X, FileImage, FileText,
  PlusCircle, MessageSquare, Trash2, Clock, PanelLeftClose, PanelLeftOpen,
  Volume2, VolumeX, Phone, PhoneOff, Plus, Mic,
} from "lucide-react";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
  mermaidCode?: string;
  citations?: { filename: string; category: string }[];
}
interface SessionMeta { _id: string; title: string; updatedAt: string; }
interface GuestContext { company_id: string; company_name: string; features: string[]; }

// ── Shared helpers ────────────────────────────────────────────────────────────
function removeEmojis(t: string) {
  return t.replace(/[\u{1F600}-\u{1F64F}]/gu,"").replace(/[\u{1F300}-\u{1F5FF}]/gu,"")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu,"").replace(/[\u{2700}-\u{27BF}]/gu,"")
    .replace(/[\u{2600}-\u{26FF}]/gu,"").replace(/\.\.\./g,".").replace(/\s+/g," ").trim();
}
function speakText(text: string, onEnd: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) { onEnd(); return; }
  window.speechSynthesis.cancel();
  const clean = removeEmojis(text);
  if (!clean) { onEnd(); return; }
  const utt = new SpeechSynthesisUtterance(clean);
  utt.rate = 1; utt.pitch = 1; utt.volume = 1;
  const eng = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("en"));
  if (eng) utt.voice = eng;
  utt.onend = onEnd; utt.onerror = onEnd;
  window.speechSynthesis.speak(utt);
}
function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

// ── Chat markdown (matches app/chat/page.tsx exactly) ─────────────────────────
function renderInlineCh(text: string, isUser: boolean): React.ReactNode[] {
  const normalized = text.replace(/<br\s*\/?>/gi, "\n");
  const hc = isUser ? "text-white" : "text-slate-800 dark:text-slate-200";
  return normalized.split(/(\*\*[\s\S]+?\*\*|\*[^*]+\*)/g).filter(Boolean).map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={idx} className={`font-semibold ${hc}`}>{part.slice(2,-2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={idx}>{part.slice(1,-1)}</em>;
    if (part.includes("\n")) return part.split("\n").map((seg,si,arr) => <span key={`${idx}-${si}`}>{seg}{si<arr.length-1&&<br/>}</span>);
    return <span key={idx}>{part}</span>;
  });
}
function ChatMarkdown({ content, isUser=false }: { content: string; isUser?: boolean }) {
  const tc = isUser ? "text-white" : "text-slate-700 dark:text-slate-300";
  const hc = isUser ? "text-white" : "text-slate-800 dark:text-slate-200";
  const lines = content.split("\n"); const els: React.ReactNode[] = []; let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.includes("```mermaid") || line.startsWith("```")) { i++; continue; }
    if (line.startsWith("### ")) { els.push(<h3 key={i} className={`text-base font-semibold mt-3 mb-1 ${hc}`}>{renderInlineCh(line.slice(4),isUser)}</h3>); i++; continue; }
    if (line.startsWith("## ")) { els.push(<h2 key={i} className={`text-lg font-semibold mt-4 mb-2 ${hc}`}>{renderInlineCh(line.slice(3),isUser)}</h2>); i++; continue; }
    if (line.startsWith("# ")) { els.push(<h1 key={i} className={`text-xl font-bold mt-4 mb-2 ${hc}`}>{renderInlineCh(line.slice(2),isUser)}</h1>); i++; continue; }
    if (line.match(/^\|(.+)\|$/) && !line.match(/^[\-|:\s]+$/)) {
      const rows: string[] = [line]; i++;
      if (i < lines.length && lines[i].match(/^[\-|:\s]+$/)) i++;
      while (i < lines.length && lines[i].match(/^\|(.+)\|$/)) { rows.push(lines[i]); i++; }
      els.push(<div key={i} className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-slate-200 dark:border-slate-600"><thead><tr>{rows[0].split("|").filter(c=>c.trim()).map((h,hi)=><th key={hi} className="px-3 py-2 text-left font-semibold bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">{renderInlineCh(h.trim(),isUser)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row,ri)=><tr key={ri} className={ri%2===0?"bg-white dark:bg-slate-800":"bg-slate-50 dark:bg-slate-700/50"}>{row.split("|").filter(c=>c.trim()).map((cell,ci)=><td key={ci} className="px-3 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">{renderInlineCh(cell.trim(),isUser)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (line.match(/^[\-|:\s]+$/)) { i++; continue; }
    if (line.match(/^[•\-\*]\s/)) { els.push(<li key={i} className={`ml-5 mb-1 ${tc} list-disc`}>{renderInlineCh(line.replace(/^[•\-\*]\s/,""),isUser)}</li>); i++; continue; }
    if (line.match(/^\d+\.\s/)) { els.push(<li key={i} className={`ml-5 mb-1 ${tc} list-decimal`}>{renderInlineCh(line.replace(/^\d+\.\s/,""),isUser)}</li>); i++; continue; }
    if (line.trim()==="") { i++; continue; }
    els.push(<p key={i} className={`mb-2 ${tc}`}>{renderInlineCh(line,isUser)}</p>); i++;
  }
  return <div className="markdown-content">{els}</div>;
}

// ── Voice markdown (matches app/voice-call/page.tsx exactly) ──────────────────
function renderInlineVo(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []; const regex = /\*\*([\s\S]+?)\*\*|\*([\s\S]+?)\*|<br\s*\/?>/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={last}>{text.slice(last,match.index)}</span>);
    if (match[0].startsWith("<br")) parts.push(<br key={match.index}/>);
    else if (match[1]!==undefined) parts.push(<strong key={match.index} className="font-semibold text-white">{match[1]}</strong>);
    else if (match[2]!==undefined) parts.push(<em key={match.index}>{match[2]}</em>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(<span key={last}>{text.slice(last)}</span>);
  return parts;
}
function VoiceMarkdown({ content, isUser=false }: { content: string; isUser?: boolean }) {
  const tc = isUser ? "text-white" : "text-gray-300";
  const lines = content.split("\n"); const els: React.ReactNode[] = []; let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.includes("```mermaid") || line.startsWith("```") || line.startsWith("`")) { i++; continue; }
    if (line.startsWith("### ")) { els.push(<h3 key={i} className="text-lg font-semibold mt-3 mb-2 text-white">{renderInlineVo(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith("## ")) { els.push(<h2 key={i} className="text-xl font-semibold mt-3 mb-2 text-white">{renderInlineVo(line.slice(3))}</h2>); i++; continue; }
    if (line.startsWith("# ")) { els.push(<h1 key={i} className="text-2xl font-bold mt-3 mb-2 text-white">{renderInlineVo(line.slice(2))}</h1>); i++; continue; }
    const tableMatch = line.match(/^\|(.+)\|$/);
    if (tableMatch && !line.includes("---")) {
      const rows: string[] = [line];
      while (i+1<lines.length && lines[i+1].match(/^\|(.+)\|$/)) { i++; rows.push(lines[i]); }
      if (i+1<lines.length && lines[i+1].match(/^[\-|:\s]+$/)) { i++; while (i+1<lines.length && lines[i+1].match(/^\|(.+)\|$/)) { i++; rows.push(lines[i]); } }
      els.push(<div key={i} className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-gray-600"><thead><tr>{rows[0].split("|").filter(c=>c.trim()).map((h,hi)=><th key={hi} className="px-3 py-2 text-left font-semibold bg-gray-700 border border-gray-600">{renderInlineVo(h.trim())}</th>)}</tr></thead><tbody>{rows.slice(1).map((row,ri)=><tr key={ri} className={ri%2===0?"bg-gray-800":"bg-gray-700/50"}>{row.split("|").filter(c=>c.trim()).map((cell,ci)=><td key={ci} className="px-3 py-2 border border-gray-600 text-gray-300">{renderInlineVo(cell.trim())}</td>)}</tr>)}</tbody></table></div>);
      i++; continue;
    }
    if (line.match(/^[\-|:\s]+$/)) { i++; continue; }
    if (line.match(/^[\-\*]\s/)) { els.push(<li key={i} className={`ml-4 mb-1 ${tc} list-disc`}>{renderInlineVo(line.slice(2))}</li>); i++; continue; }
    if (line.match(/^\d+\.\s/)) { els.push(<li key={i} className={`ml-4 mb-1 ${tc} list-decimal`}>{renderInlineVo(line.replace(/^\d+\.\s/,""))}</li>); i++; continue; }
    if (line.trim()==="") { i++; continue; }
    els.push(<p key={i} className={`mb-2 ${tc}`}>{renderInlineVo(line)}</p>); i++;
  }
  return <div className="markdown-content">{els}</div>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GuestPage() {
  const params = useParams();
  const token = params.token as string;

  const [guestCtx, setGuestCtx] = useState<GuestContext | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [validating, setValidating] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "voice">("chat");

  // ── Chat state ──────────────────────────────────────────────────────────────
  const [chatSessions, setChatSessions] = useState<SessionMeta[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSessionsLoading, setChatSessionsLoading] = useState(true);
  const [chatError, setChatError] = useState("");
  const [showFlowchart, setShowFlowchart] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ── Voice state ─────────────────────────────────────────────────────────────
  const [voiceSessions, setVoiceSessions] = useState<SessionMeta[]>([]);
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null);
  const [voiceMessages, setVoiceMessages] = useState<Message[]>([]);
  const [voiceInput, setVoiceInput] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceSessionsLoading, setVoiceSessionsLoading] = useState(true);
  const [voiceError, setVoiceError] = useState("");
  const [voiceShowFlowchart, setVoiceShowFlowchart] = useState<string | null>(null);
  const [deletingVoiceId, setDeletingVoiceId] = useState<string | null>(null);
  const [voiceSidebarOpen, setVoiceSidebarOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState("Ready");
  const voiceChatRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voiceSessionIdRef = useRef<string | null>(null);
  useEffect(() => { voiceSessionIdRef.current = voiceSessionId; }, [voiceSessionId]);

  const gh = useCallback(() => ({ "Content-Type": "application/json", "x-guest-token": token }), [token]);

  // Validate token
  useEffect(() => {
    fetch(`/api/guest/validate?token=${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setGuestCtx(d); if (!d.features.includes("chat") && d.features.includes("voice")) setActiveTab("voice"); })
      .catch(() => setInvalid(true))
      .finally(() => setValidating(false));
  }, [token]);

  useEffect(() => { if (window.innerWidth < 768) { setChatSidebarOpen(false); setVoiceSidebarOpen(false); } }, []);
  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [messages]);
  useEffect(() => { if (voiceChatRef.current) voiceChatRef.current.scrollTop = voiceChatRef.current.scrollHeight; }, [voiceMessages]);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"; s.async = true;
    document.head.appendChild(s); return () => { document.head.removeChild(s); };
  }, []);
  useEffect(() => {
    const fc = showFlowchart || voiceShowFlowchart;
    if (fc) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = (window as any).mermaid;
      if (m) { try { m.initialize({ startOnLoad: true }); m.run({ querySelector: ".mermaid-chart" }); } catch { /* ignore */ } }
    }
  }, [showFlowchart, voiceShowFlowchart]);

  // ── Chat fetchers ───────────────────────────────────────────────────────────
  const fetchChatSessions = useCallback(async () => {
    setChatSessionsLoading(true);
    try { const r = await fetch("/api/chat/sessions?mode=chat", { headers: gh() }); if (r.ok) { const d = await r.json(); setChatSessions(d.sessions||[]); } }
    finally { setChatSessionsLoading(false); }
  }, [gh]);

  const fetchVoiceSessions = useCallback(async () => {
    setVoiceSessionsLoading(true);
    try { const r = await fetch("/api/chat/sessions?mode=voice", { headers: gh() }); if (r.ok) { const d = await r.json(); setVoiceSessions(d.sessions||[]); } }
    finally { setVoiceSessionsLoading(false); }
  }, [gh]);

  useEffect(() => { if (guestCtx) { fetchChatSessions(); fetchVoiceSessions(); } }, [guestCtx, fetchChatSessions, fetchVoiceSessions]);

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    return new Date(iso).toLocaleDateString();
  };
  const extractMermaid = (t: string) => { const m = /```mermaid\s*([\s\S]*?)```/g.exec(t); return m ? m[1].trim() : null; };
  const cleanContent = (t: string, mc: string|null|undefined) => mc ? t.replace(/```mermaid[\s\S]*?```/g,"").trim() : t;

  // ── Chat actions ────────────────────────────────────────────────────────────
  const createNewChat = async () => {
    const r = await fetch("/api/chat/sessions", { method:"POST", headers:gh(), body:JSON.stringify({mode:"chat"}) });
    if (r.ok) { const d = await r.json(); setChatSessions(p=>[d.session,...p]); setChatSessionId(d.session._id); setMessages([]); setChatError(""); if (window.innerWidth<768) setChatSidebarOpen(false); }
  };
  const loadChatSession = async (id: string) => {
    setChatSessionId(id); setChatError("");
    const r = await fetch(`/api/chat/sessions/${id}`, { headers:gh() });
    if (r.ok) { const d = await r.json(); setMessages((d.session.messages||[]).map((m: Message) => ({ role:m.role, content:m.content, mermaidCode:m.mermaidCode, citations:m.citations||[] }))); if (window.innerWidth<768) setChatSidebarOpen(false); }
  };
  const deleteChatSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); if (!confirm("Delete this chat?")) return;
    setDeletingChatId(id);
    await fetch(`/api/chat/sessions/${id}`, { method:"DELETE", headers:gh() });
    setChatSessions(p=>p.filter(s=>s._id!==id));
    if (chatSessionId===id) { setChatSessionId(null); setMessages([]); }
    setDeletingChatId(null);
  };
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!input.trim()||chatLoading) return;
    let sid = chatSessionId;
    if (!sid) {
      const r = await fetch("/api/chat/sessions", { method:"POST", headers:gh(), body:JSON.stringify({mode:"chat"}) });
      if (!r.ok) return; const d = await r.json(); sid = d.session._id; setChatSessionId(sid); setChatSessions(p=>[d.session,...p]);
    }
    const msg = input.trim(); setInput(""); setMessages(p=>[...p,{role:"user",content:msg}]); setChatLoading(true); setChatError("");
    try {
      const r = await fetch("/api/chat", { method:"POST", headers:gh(), body:JSON.stringify({message:msg,history:messages}) });
      const data = await r.json();
      if (!r.ok) { setChatError(data.message||"Failed"); }
      else {
        setMessages(p=>[...p,{role:"assistant",content:data.message,mermaidCode:data.mermaidCode,citations:data.citations||[]}]);
        await fetch(`/api/chat/sessions/${sid}`, { method:"PATCH", headers:gh(), body:JSON.stringify({userMessage:msg,assistantMessage:data.message,mermaidCode:data.mermaidCode,citations:data.citations}) });
        fetchChatSessions();
      }
    } catch { setChatError("Something went wrong. Please try again."); }
    finally { setChatLoading(false); }
  };

  // ── Voice actions ───────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    stopSpeaking(); if (recognitionRef.current) recognitionRef.current.stop();
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    setIsInCall(false); setIsListening(false); setIsSpeaking(false); setCallStatus("Ready");
  }, []);

  const handleVoiceSubmit = useCallback(async (text: string) => {
    if (!text.trim()||voiceLoading) return;
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (recognitionRef.current&&isListening) recognitionRef.current.stop();
    const msg = text.trim(); setVoiceInput("");
    setVoiceMessages(p=>[...p,{role:"user",content:msg}]); setVoiceLoading(true); setCallStatus("Processing");
    try {
      const r = await fetch("/api/chat", { method:"POST", headers:gh(), body:JSON.stringify({message:msg,history:voiceMessages,mode:"voice"}) });
      const data = await r.json();
      if (!r.ok) { setVoiceError(data.message||"Failed"); setCallStatus("Error"); if (isInCall) { try { recognitionRef.current?.start(); } catch { /* ignore */ } } }
      else {
        setIsSpeaking(true); setCallStatus("Speaking");
        setVoiceMessages(p=>[...p,{role:"assistant",content:data.message,mermaidCode:data.mermaidCode}]);
        const sid = voiceSessionIdRef.current;
        if (sid) {
          fetch(`/api/chat/sessions/${sid}`, { method:"PATCH", headers:gh(), body:JSON.stringify({userMessage:msg,assistantMessage:data.message,mermaidCode:data.mermaidCode}) })
            .then(r=>r.json()).then(d=>{ if (d.session) setVoiceSessions(p=>p.map(s=>s._id===sid?{...s,title:d.session.title,updatedAt:d.session.updatedAt}:s)); }).catch(()=>{});
        }
        if (!isMuted) { speakText(data.message, ()=>{ setIsSpeaking(false); if (isInCall) { try { recognitionRef.current?.start(); } catch { /* ignore */ } } }); }
        else { setIsSpeaking(false); if (isInCall) { try { recognitionRef.current?.start(); } catch { /* ignore */ } } }
      }
    } catch { setVoiceError("Something went wrong."); setCallStatus("Error"); }
    finally { setVoiceLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gh, voiceMessages, isInCall, isListening, isMuted, voiceLoading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SR() as any;
    recognitionRef.current = rec;
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onstart = () => { setCallStatus("Listening"); setIsListening(true); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      let final = "", interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      const current = final || interim; setVoiceInput(current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (current.trim()) silenceTimeoutRef.current = setTimeout(() => { if (current.trim()) handleVoiceSubmit(current.trim()); }, 1500);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      if (event.error==="not-allowed") { setVoiceError("Microphone access denied"); endCall(); }
      else if (event.error!=="no-speech") { setIsListening(false); setCallStatus("Error"); }
    };
    rec.onend = () => { if (isInCall&&isListening) { try { rec.start(); } catch { /* ignore */ } } };
    return () => { if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current); rec.stop(); };
  }, [isInCall, handleVoiceSubmit, endCall]);

  useEffect(() => {
    if (isSpeaking&&isInCall&&isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else if (!isSpeaking&&isInCall&&!isListening) { try { recognitionRef.current?.start(); } catch { /* ignore */ } }
  }, [isSpeaking, isInCall, isListening]);

  const startCall = async () => {
    if (!recognitionRef.current) { setVoiceError("Speech recognition not supported in this browser"); return; }
    try {
      const r = await fetch("/api/chat/sessions", { method:"POST", headers:gh(), body:JSON.stringify({mode:"voice"}) });
      const data = await r.json();
      if (r.ok) { setVoiceSessionId(data.session._id); setVoiceSessions(p=>[{_id:data.session._id,title:"New Chat",updatedAt:new Date().toISOString()},...p]); }
      setIsInCall(true); setVoiceMessages([]); setCallStatus("Listening"); setVoiceInput("");
      recognitionRef.current.start();
    } catch { setVoiceError("Failed to start call. Check microphone permissions."); }
  };

  const loadVoiceSession = async (id: string) => {
    try {
      const r = await fetch(`/api/chat/sessions/${id}`, { headers:gh() });
      const data = await r.json();
      if (r.ok) { setVoiceMessages(data.session.messages.map((m: Message)=>({role:m.role,content:m.content,mermaidCode:m.mermaidCode}))); setVoiceSessionId(id); if (isInCall) endCall(); if (window.innerWidth<768) setVoiceSidebarOpen(false); }
    } catch { /* silent */ }
  };
  const deleteVoiceSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); setDeletingVoiceId(id);
    try { await fetch(`/api/chat/sessions/${id}`, { method:"DELETE", headers:gh() }); setVoiceSessions(p=>p.filter(s=>s._id!==id)); if (voiceSessionId===id) { setVoiceSessionId(null); setVoiceMessages([]); } }
    catch { /* silent */ } finally { setDeletingVoiceId(null); }
  };
  const clearVoiceChat = () => { setVoiceMessages([]); setVoiceInput(""); setVoiceSessionId(null); };

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (validating) return <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0b1220]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></main>;
  if (invalid) return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-[#0b1220] gap-4 p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><X className="w-8 h-8 text-red-500" /></div>
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Link Unavailable</h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm">This link is invalid, disabled, or has expired. Please contact the company for a new link.</p>
    </main>
  );

  const hasChat = guestCtx?.features.includes("chat");
  const hasVoice = guestCtx?.features.includes("voice");

  // ── CHAT TAB — exact copy of app/chat/page.tsx JSX ─────────────────────────
  const chatTab = (
    <main className="relative min-h-screen overflow-hidden flex flex-col bg-slate-100 dark:bg-[#0b1220]">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-white to-blue-100 dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40" />
      <div className="absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px] bg-blue-300/40 dark:bg-blue-700/20" />
      <div className="absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px] bg-indigo-300/35 dark:bg-indigo-800/25" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          {hasVoice && (
            <button onClick={() => setActiveTab("voice")} title="Switch to Voice"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-700 transition-all">
              <Mic className="w-4 h-4" />
            </button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setChatSidebarOpen(o => !o)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" title="Toggle history">
            {chatSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </Button>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-blue-500" /><h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">AI Chat</h1></div>
          {guestCtx && <span className="text-xs text-slate-500 dark:text-slate-400">{guestCtx.company_name}</span>}
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex justify-center"><div className="w-10 h-10 bg-blue-400/20 rounded-full blur-[20px]" /></div>
          <Image src="/logo.png" alt="Logo" width={100} height={57} className="relative z-10 opacity-80" />
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {chatSidebarOpen && <div className="absolute inset-0 z-10 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setChatSidebarOpen(false)} />}
        <aside className={`absolute md:static z-20 h-full flex-shrink-0 flex flex-col border-r border-slate-200/60 dark:border-slate-700/60 bg-white drop-shadow-xl md:drop-shadow-none md:bg-white/40 dark:bg-slate-900 md:dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden transition-all duration-300 ${chatSidebarOpen ? "w-64" : "w-0 border-r-0"}`}>
          <div className="p-3 border-b border-slate-200/60 dark:border-slate-700/60">
            <Button onClick={createNewChat} className="w-full h-9 bg-slate-800 text-white dark:bg-slate-700/60 dark:text-slate-100 border border-black/10 dark:border-white/10 hover:bg-slate-700 text-sm">
              <PlusCircle className="w-4 h-4 mr-2" /> New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1.5">History</p>
            {chatSessionsLoading && <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>}
            {!chatSessionsLoading && chatSessions.length === 0 && <div className="text-center py-8"><MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" /><p className="text-xs text-slate-500 dark:text-slate-400">No chats yet</p></div>}
            {chatSessions.map(s => (
              <div key={s._id} onClick={() => loadChatSession(s._id)}
                className={`group flex items-start justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${chatSessionId === s._id ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" : "hover:bg-slate-100/70 dark:hover:bg-slate-800/50 border border-transparent"}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{s.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{formatTime(s.updatedAt)}</p>
                </div>
                <button onClick={e => deleteChatSession(s._id, e)} disabled={deletingChatId === s._id}
                  className="ml-1 p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0 mt-0.5">
                  {deletingChatId === s._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          {showFlowchart && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="relative w-full max-w-4xl max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"><FileImage className="w-5 h-5" />Process Flowchart</h3>
                  <button onClick={() => setShowFlowchart(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-600 dark:text-slate-400" /></button>
                </div>
                <div className="p-6 overflow-auto max-h-[calc(80vh-60px)]"><div className="mermaid-chart flex justify-center">{showFlowchart}</div></div>
              </div>
            </div>
          )}

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
                <Bot className="w-16 h-16 text-slate-400 dark:text-slate-600" />
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Ask me anything about your documents</h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-md">I&apos;ll search through your uploaded documents and provide answers using AI.</p>
              </div>
            ) : messages.map((msg, idx) => {
              const mc = msg.mermaidCode || extractMermaid(msg.content);
              const dc = cleanContent(msg.content, mc);
              return (
                <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center"><Bot className="w-5 h-5 text-blue-500" /></div>}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-slate-800 dark:bg-slate-700 text-white" : "bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50"}`}>
                    <ChatMarkdown content={dc} isUser={msg.role === "user"} />
                    {mc && <Button onClick={() => setShowFlowchart(mc)} className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"><FileImage className="w-4 h-4" />View Flowchart</Button>}
                    {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                        {msg.citations.map((c, ci) => (
                          <span key={ci} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                            <FileText className="w-3 h-3 flex-shrink-0" />{c.filename}{c.category && <span className="text-slate-400 dark:text-slate-500">· {c.category}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600/20 dark:bg-slate-600/30 flex items-center justify-center"><User className="w-5 h-5 text-slate-600 dark:text-slate-400" /></div>}
                </div>
              );
            })}
            {chatLoading && <div className="flex gap-3 justify-start"><div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center"><Bot className="w-5 h-5 text-blue-500" /></div><div className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl px-4 py-3"><div className="flex gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:"0ms"}}/><span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:"150ms"}}/><span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:"300ms"}}/></div></div></div>}
            {chatError && <div className="flex justify-center"><div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg px-4 py-2 text-sm">{chatError}</div></div>}
          </div>

          <div className="px-4 py-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
            <form onSubmit={handleChatSubmit} className="max-w-4xl mx-auto flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask a question about your documents..." disabled={chatLoading} className="flex-1 h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50" />
              <Button type="submit" disabled={chatLoading || !input.trim()} className="h-12 px-6 bg-slate-800 text-white dark:bg-slate-700/60 dark:text-slate-100 border border-black/10 dark:border-white/10 hover:bg-slate-700 disabled:opacity-50">
                {chatLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );

  // ── VOICE TAB — exact copy of app/voice-call/page.tsx JSX ──────────────────
  const voiceTab = (
    <main className="h-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="relative flex-none flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          {hasChat && (
            <button onClick={() => setActiveTab("chat")} title="Switch to Chat"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700 border border-gray-600 text-gray-400 hover:bg-blue-900/40 hover:text-blue-400 hover:border-blue-700 transition-all">
              <Zap className="w-4 h-4" />
            </button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setVoiceSidebarOpen(o => !o)} className="text-gray-400 hover:text-blue-400 hover:bg-gray-700/60" title="Toggle history">
            {voiceSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </Button>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><h1 className="text-lg font-semibold text-white">Voice AI</h1></div>
          {guestCtx && <span className="text-xs text-gray-400">{guestCtx.company_name}</span>}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-blue-400 hover:bg-gray-700/60">
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>

      {/* Flowchart Modal */}
      {voiceShowFlowchart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-700/50">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2"><FileImage className="w-5 h-5" /> Flowchart</h3>
              <button onClick={() => setVoiceShowFlowchart(null)} className="p-2 hover:bg-gray-600 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 overflow-auto max-h-[60vh] bg-gray-100"><div className="mermaid-chart flex justify-center">{voiceShowFlowchart}</div></div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {voiceSidebarOpen && <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setVoiceSidebarOpen(false)} />}
        <div className={`absolute md:static z-20 h-full flex-shrink-0 flex flex-col border-r border-gray-700 bg-gray-900 drop-shadow-xl md:drop-shadow-none md:bg-gray-800/40 transition-all duration-300 overflow-hidden ${voiceSidebarOpen ? "w-56" : "w-0 border-r-0"}`}>
          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">History</span>
            <button onClick={() => { clearVoiceChat(); if (isInCall) endCall(); if (window.innerWidth<768) setVoiceSidebarOpen(false); }} className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="New session">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {voiceSessionsLoading ? <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-gray-500" /></div>
              : voiceSessions.length === 0 ? <p className="text-xs text-gray-500 text-center py-6 px-2">No voice sessions yet</p>
              : voiceSessions.map(s => (
                <div key={s._id} onClick={() => loadVoiceSession(s._id)}
                  className={`group flex items-start gap-2 px-3 py-2 cursor-pointer rounded mx-1 my-0.5 transition-colors ${voiceSessionId === s._id ? "bg-blue-600/20 border border-blue-500/30" : "hover:bg-gray-700/50"}`}>
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 truncate">{s.title}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5"><Clock className="w-2.5 h-2.5" />{formatTime(s.updatedAt)}</p>
                  </div>
                  <button onClick={e => deleteVoiceSession(s._id, e)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all flex-shrink-0">
                    {deletingVoiceId === s._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Globe & Controls */}
        <div className="flex-shrink-0 md:flex-1 h-auto flex flex-col items-center justify-center py-6 px-4 md:border-r border-b md:border-b-0 border-gray-700 bg-gray-800/30">
          <div className="relative w-28 h-28 md:w-72 md:h-72 flex-shrink-0 md:mb-6 mb-4 mt-2 md:mt-0">
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isSpeaking ? "scale-110" : isListening ? "scale-105" : "scale-100"}`}>
              <Image src="/globe.gif" alt="AI" width={400} height={400}
                className={`w-full h-full object-contain rounded-full opacity-90 ${isSpeaking ? "animate-spin-slow" : isListening ? "animate-pulse" : ""}`}
                style={{ filter: isSpeaking ? "drop-shadow(0 0 30px rgba(59,130,246,0.8))" : isListening ? "drop-shadow(0 0 20px rgba(59,130,246,0.5))" : "drop-shadow(0 0 10px rgba(59,130,246,0.3))" }} />
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium md:mb-6 mb-4 flex-shrink-0 ${isListening ? "bg-green-500/20 text-green-400 border border-green-500/30" : isSpeaking ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : isInCall ? "bg-gray-700 text-gray-300 border border-gray-600" : "bg-gray-800 text-gray-400 border border-gray-700"}`}>{callStatus}</div>
          <div className="flex flex-col items-center gap-4 flex-shrink-0 h-16 justify-center">
            {!isInCall
              ? <Button onClick={startCall} className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30"><Phone className="w-7 h-7" /></Button>
              : <div className="relative flex items-center justify-center">
                  <Button onClick={endCall} className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30"><PhoneOff className="w-7 h-7" /></Button>
                  <Button onClick={stopSpeaking} className={`absolute -right-16 h-12 w-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30 transition-opacity duration-200 ${isSpeaking ? "opacity-100" : "opacity-0 pointer-events-none"}`}><VolumeX className="w-6 h-6" /></Button>
                </div>
            }
          </div>
          <div className="mt-6 flex items-center gap-2 flex-shrink-0 h-6">
            {isInCall && <><div className={`w-3 h-3 rounded-full ${isListening ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} /><span className="text-gray-400 text-sm">{isListening ? "Mic On" : "Mic Off"}</span></>}
          </div>
        </div>

        {/* Conversation Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-900">
          <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/50">
            <h2 className="text-white font-medium">Conversation</h2>
            {voiceMessages.length > 0 && <Button onClick={clearVoiceChat} variant="ghost" size="sm" className="text-gray-400 hover:text-white"><Trash2 className="w-4 h-4 mr-1" /> Clear</Button>}
          </div>
          <div ref={voiceChatRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {voiceMessages.length === 0
              ? <div className="flex flex-col items-center justify-center h-full text-center space-y-3 min-h-[200px]"><div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center"><Bot className="w-6 h-6 text-gray-400" /></div><p className="text-gray-500 text-sm">Start a call to begin</p></div>
              : voiceMessages.map((msg, idx) => {
                  const mc = msg.mermaidCode || extractMermaid(msg.content);
                  const dc = cleanContent(msg.content, mc);
                  return (
                    <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center"><Bot className="w-5 h-5 text-blue-400" /></div>}
                      <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200 border border-gray-700"}`}>
                        <VoiceMarkdown content={dc} isUser={msg.role === "user"} />
                        {mc && <Button onClick={() => setVoiceShowFlowchart(mc)} className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"><FileImage className="w-4 h-4" /> View Flowchart</Button>}
                      </div>
                      {msg.role === "user" && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"><User className="w-5 h-5 text-gray-300" /></div>}
                    </div>
                  );
                })
            }
            {voiceLoading && <div className="flex gap-3 justify-start"><div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center"><Bot className="w-5 h-5 text-blue-400" /></div><div className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700"><div className="flex gap-1"><span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{animationDelay:"0ms"}}/><span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{animationDelay:"150ms"}}/><span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{animationDelay:"300ms"}}/></div></div></div>}
            {voiceError && <div className="flex justify-center"><div className="bg-red-900/30 text-red-400 rounded-lg px-4 py-2 border border-red-800">{voiceError}</div></div>}
            {voiceInput && <div className="flex justify-end"><div className="max-w-[80%] rounded-xl px-4 py-2 bg-blue-600/30 text-blue-200 text-sm italic border border-blue-500/30">{voiceInput}</div></div>}
          </div>
        </div>
      </div>
    </main>
  );

  return activeTab === "voice" && hasVoice ? voiceTab : chatTab;
}
