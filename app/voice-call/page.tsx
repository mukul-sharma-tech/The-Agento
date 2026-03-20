"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Loader2, Bot, User, ArrowLeft, X, FileImage,
  Volume2, VolumeX, Phone, PhoneOff, Trash2,
  MessageSquare, Plus, Clock, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
  mermaidCode?: string;
}

interface SessionMeta {
  _id: string;
  title: string;
  updatedAt: string;
}

function removeEmojis(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/\.\.\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

function speakText(text: string, onEnd: () => void) {
  if (typeof window !== "undefined" && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const cleanText = removeEmojis(text);
    if (!cleanText) { onEnd(); return; }
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1; utterance.pitch = 1; utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  } else { onEnd(); }
}

function stopSpeaking() {
  if (typeof window !== "undefined" && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([\s\S]+?)\*\*|\*([\s\S]+?)\*|<br\s*\/?>/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={last}>{text.slice(last, match.index)}</span>);
    if (match[0].startsWith('<br')) parts.push(<br key={match.index} />);
    else if (match[1] !== undefined) parts.push(<strong key={match.index} className="font-semibold text-white">{match[1]}</strong>);
    else if (match[2] !== undefined) parts.push(<em key={match.index}>{match[2]}</em>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(<span key={last}>{text.slice(last)}</span>);
  return parts;
}

function MarkdownContent({ content, isUser = false }: { content: string; isUser?: boolean }) {
  const tc = isUser ? "text-white" : "text-gray-300";
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.includes('```mermaid') || line.startsWith('```') || line.startsWith('`')) { i++; continue; }
    if (line.startsWith('### ')) { elements.push(<h3 key={i} className="text-lg font-semibold mt-3 mb-2 text-white">{renderInline(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith('## ')) { elements.push(<h2 key={i} className="text-xl font-semibold mt-3 mb-2 text-white">{renderInline(line.slice(3))}</h2>); i++; continue; }
    if (line.startsWith('# ')) { elements.push(<h1 key={i} className="text-2xl font-bold mt-3 mb-2 text-white">{renderInline(line.slice(2))}</h1>); i++; continue; }
    const tableMatch = line.match(/^\|(.+)\|$/);
    if (tableMatch && !line.includes('---')) {
      const tableRows: string[] = [line];
      while (i + 1 < lines.length && lines[i + 1].match(/^\|(.+)\|$/)) { i++; tableRows.push(lines[i]); }
      if (i + 1 < lines.length && lines[i + 1].match(/^[\-|:\s]+$/)) {
        i++;
        while (i + 1 < lines.length && lines[i + 1].match(/^\|(.+)\|$/)) { i++; tableRows.push(lines[i]); }
      }
      const headers = tableRows[0].split('|').filter(c => c.trim()).map((h, idx) => (
        <th key={idx} className="px-3 py-2 text-left font-semibold bg-gray-700 border border-gray-600">{renderInline(h.trim())}</th>
      ));
      const rows = tableRows.slice(1).map((row, ri) => (
        <tr key={ri} className={ri % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700/50'}>
          {row.split('|').filter(c => c.trim()).map((cell, ci) => (
            <td key={ci} className="px-3 py-2 border border-gray-600 text-gray-300">{renderInline(cell.trim())}</td>
          ))}
        </tr>
      ));
      elements.push(<div key={i} className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-gray-600"><thead><tr>{headers}</tr></thead><tbody>{rows}</tbody></table></div>);
      i++; continue;
    }
    if (line.match(/^[\-|:\s]+$/)) { i++; continue; }
    if (line.match(/^[\-\*]\s/)) { elements.push(<li key={i} className={`ml-4 mb-1 ${tc} list-disc`}>{renderInline(line.slice(2))}</li>); i++; continue; }
    if (line.match(/^\d+\.\s/)) { elements.push(<li key={i} className={`ml-4 mb-1 ${tc} list-decimal`}>{renderInline(line.replace(/^\d+\.\s/, ''))}</li>); i++; continue; }
    if (line.trim() === '') { i++; continue; }
    elements.push(<p key={i} className={`mb-2 ${tc}`}>{renderInline(line)}</p>);
    i++;
  }
  return <div className="markdown-content">{elements}</div>;
}

export default function VoiceCallPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFlowchart, setShowFlowchart] = useState<string | null>(null);

  // Call state
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("Ready");

  // Session history
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);

  // Keep ref in sync with state (needed inside async callbacks)
  useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Fetch voice sessions on mount
  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const res = await fetch("/api/chat/sessions?mode=voice");
      const data = await res.json();
      if (res.ok) setSessions(data.sessions || []);
    } catch { /* silent */ }
    finally { setSessionsLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchSessions();
  }, [status, fetchSessions]);

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);

  // Load a past session
  const loadSession = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${id}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.session.messages.map((m: any) => ({
          role: m.role, content: m.content, mermaidCode: m.mermaidCode,
        })));
        setActiveSessionId(id);
        // End any active call when loading history
        if (isInCall) endCall();
      }
    } catch { /* silent */ }
  };

  // Delete a session
  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
      setSessions(prev => prev.filter(s => s._id !== id));
      if (activeSessionId === id) { setActiveSessionId(null); setMessages([]); }
    } catch { /* silent */ }
    finally { setDeletingId(null); }
  };

  // Format timestamp
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  // Speech recognition setup
  useEffect(() => {
    if (typeof window !== "undefined" && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => { setCallStatus("Listening"); setIsListening(true); };

      recognitionRef.current.onresult = (event: any) => {
        let final = '', interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        const current = final || interim;
        setInput(current);
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        if (current.trim()) {
          silenceTimeoutRef.current = setTimeout(() => {
            if (current.trim()) handleVoiceSubmit(current.trim());
          }, 1500);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'not-allowed') { setError("Microphone access denied"); endCall(); }
        else if (event.error !== 'no-speech') { setIsListening(false); setCallStatus("Error"); }
      };

      recognitionRef.current.onend = () => {
        if (isInCall && isListening) {
          try { recognitionRef.current.start(); } catch { /* ignore */ }
        }
      };
    }
    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isInCall]);

  // Auto-mute mic when AI speaks
  useEffect(() => {
    if (isSpeaking && isInCall && recognitionRef.current && isListening) {
      recognitionRef.current.stop(); setIsListening(false);
    } else if (!isSpeaking && isInCall && !isListening && recognitionRef.current) {
      try { recognitionRef.current.start(); } catch { /* ignore */ }
    }
  }, [isSpeaking, isInCall, isListening]);

  const startCall = async () => {
    if (!recognitionRef.current) { setError("Speech recognition not supported in this browser"); return; }
    try {
      // Create a new session
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "voice" }),
      });
      const data = await res.json();
      if (res.ok) {
        const newId = data.session._id;
        setActiveSessionId(newId);
        setSessions(prev => [{ _id: newId, title: "New Chat", updatedAt: new Date().toISOString() }, ...prev]);
      }
      setIsInCall(true);
      setMessages([]);
      setCallStatus("Listening");
      setInput("");
      recognitionRef.current.start();
    } catch {
      setError("Failed to start call. Check microphone permissions.");
    }
  };

  const endCall = () => {
    stopSpeaking();
    if (recognitionRef.current) recognitionRef.current.stop();
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    setIsInCall(false); setIsListening(false); setIsSpeaking(false); setCallStatus("Ready");
  };

  const clearChat = () => {
    setMessages([]); setInput(""); setActiveSessionId(null);
  };

  const handleVoiceSubmit = async (text: string) => {
    if (!text.trim() || loading) return;
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (recognitionRef.current && isListening) recognitionRef.current.stop();

    const userMessage = text.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true); setCallStatus("Processing");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: messages, mode: "voice" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to get response");
        setCallStatus("Error");
        if (isInCall && recognitionRef.current) recognitionRef.current.start();
      } else {
        setIsSpeaking(true); setCallStatus("Speaking");
        setMessages(prev => [...prev, { role: "assistant", content: data.message, mermaidCode: data.mermaidCode }]);

        // Save to session
        const sid = activeSessionIdRef.current;
        if (sid) {
          fetch(`/api/chat/sessions/${sid}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userMessage, assistantMessage: data.message, mermaidCode: data.mermaidCode }),
          }).then(r => r.json()).then(d => {
            if (d.session) {
              setSessions(prev => prev.map(s => s._id === sid ? { ...s, title: d.session.title, updatedAt: d.session.updatedAt } : s));
            }
          }).catch(() => {});
        }

        if (!isMuted) {
          speakText(data.message, () => {
            setIsSpeaking(false);
            if (isInCall && recognitionRef.current) {
              try { recognitionRef.current.start(); } catch { /* ignore */ }
            }
          });
        } else {
          setIsSpeaking(false);
          if (isInCall && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch { /* ignore */ }
          }
        }
      }
    } catch {
      setError("Something went wrong."); setCallStatus("Error");
      if (isInCall && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* ignore */ }
      }
    } finally { setLoading(false); }
  };

  const extractMermaidCode = (text: string): string | null => {
    const m = /```mermaid\s*([\s\S]*?)```/g.exec(text);
    return m ? m[1].trim() : null;
  };

  const cleanContent = (text: string, mermaidCode: string | null | undefined): string => {
    return mermaidCode ? text.replace(/```mermaid[\s\S]*?```/g, '').trim() : text;
  };

  if (status === "loading") {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-gray-900 overflow-hidden">

      {/* Header */}
      <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => { endCall(); router.push("/dashboard"); }} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(o => !o)} className="text-gray-400 hover:text-blue-400 hover:bg-gray-700/60" title="Toggle history">
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h1 className="text-lg font-semibold text-white">Voice AI</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-blue-400 hover:bg-gray-700/60">
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>      </div>

      {/* Flowchart Modal */}
      {showFlowchart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-700/50">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2"><FileImage className="w-5 h-5" /> Flowchart</h3>
              <button onClick={() => setShowFlowchart(null)} className="p-2 hover:bg-gray-600 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[60vh] bg-gray-100">
              <div className="mermaid-chart flex justify-center">{showFlowchart}</div>
            </div>
          </div>
        </div>
      )}

      {/* Body: Sidebar + Globe + Chat */}
      <div className="flex-1 flex overflow-hidden">

        {/* History Sidebar */}
        <div className={`flex-shrink-0 flex flex-col border-r border-gray-700 bg-gray-800/40 transition-all duration-300 overflow-hidden ${sidebarOpen ? 'w-56' : 'w-0 border-r-0'}`}>
          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">History</span>
            <button
              onClick={() => { clearChat(); if (isInCall) endCall(); }}
              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="New session"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {sessionsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-gray-500" /></div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6 px-2">No voice sessions yet</p>
            ) : (
              sessions.map(s => (
                <div
                  key={s._id}
                  onClick={() => loadSession(s._id)}
                  className={`group flex items-start gap-2 px-3 py-2 cursor-pointer rounded mx-1 my-0.5 transition-colors ${activeSessionId === s._id ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-gray-700/50'}`}
                >
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 truncate">{s.title}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />{formatTime(s.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={e => deleteSession(s._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    {deletingId === s._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Globe & Controls */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 border-r border-gray-700 bg-gray-800/30">
          <div className="relative w-72 h-72 flex-shrink-0 mb-6">
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'scale-110' : isListening ? 'scale-105' : 'scale-100'}`}>
              <Image
                src="/globe.gif" alt="AI" width={400} height={400}
                className={`${isSpeaking ? 'animate-spin-slow' : isListening ? 'animate-pulse' : ''} rounded-full opacity-90`}
                style={{ filter: isSpeaking ? 'drop-shadow(0 0 30px rgba(59,130,246,0.8))' : isListening ? 'drop-shadow(0 0 20px rgba(59,130,246,0.5))' : 'drop-shadow(0 0 10px rgba(59,130,246,0.3))' }}
              />
            </div>
          </div>

          <div className={`px-4 py-2 rounded-full text-sm font-medium mb-6 flex-shrink-0 ${
            isListening ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            isSpeaking ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            isInCall ? 'bg-gray-700 text-gray-300 border border-gray-600' :
            'bg-gray-800 text-gray-400 border border-gray-700'
          }`}>{callStatus}</div>

          <div className="flex flex-col items-center gap-4 flex-shrink-0 h-16 justify-center">
            {!isInCall ? (
              <Button onClick={startCall} className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30">
                <Phone className="w-7 h-7" />
              </Button>
            ) : (
              <div className="relative flex items-center justify-center">
                <Button onClick={endCall} className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30">
                  <PhoneOff className="w-7 h-7" />
                </Button>
                <Button onClick={stopSpeaking} className={`absolute -right-16 h-12 w-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30 transition-opacity duration-200 ${isSpeaking ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <VolumeX className="w-6 h-6" />
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2 flex-shrink-0 h-6">
            {isInCall && (
              <>
                <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-gray-400 text-sm">{isListening ? 'Mic On' : 'Mic Off'}</span>
              </>
            )}
          </div>
        </div>

        {/* Conversation Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-900">
          <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/50">
            <h2 className="text-white font-medium">Conversation</h2>
            {messages.length > 0 && (
              <Button onClick={clearChat} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Trash2 className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 min-h-[200px]">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Start a call to begin</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const mermaidCode = msg.mermaidCode || extractMermaidCode(msg.content);
                const displayContent = cleanContent(msg.content, mermaidCode);
                return (
                  <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-blue-400" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200 border border-gray-700"}`}>
                      <MarkdownContent content={displayContent} isUser={msg.role === "user"} />
                      {mermaidCode && (
                        <Button onClick={() => setShowFlowchart(mermaidCode)} className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600">
                          <FileImage className="w-4 h-4" /> View Flowchart
                        </Button>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-900/30 text-red-400 rounded-lg px-4 py-2 border border-red-800">{error}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
