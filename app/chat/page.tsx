"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Bot, User, ArrowLeft, Zap, X, FileImage } from "lucide-react";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
  mermaidCode?: string;
}

// Simple markdown renderer component
function MarkdownContent({ content, isUser = false }: { content: string; isUser?: boolean }) {
  const textColorClass = isUser ? "text-white" : "text-slate-700 dark:text-slate-300";
  
  // Parse and render markdown-like content with proper styling
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Skip mermaid code blocks (they'll be handled separately)
      if (line.includes('```mermaid')) {
        i++;
        continue;
      }

      // Skip code block markers
      if (line.startsWith('```') || line.startsWith('`')) {
        i++;
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className={`text-lg font-semibold mt-4 mb-2 ${isUser ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
            {line.slice(4)}
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className={`text-xl font-semibold mt-4 mb-2 ${isUser ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
            {line.slice(3)}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className={`text-2xl font-bold mt-4 mb-2 ${isUser ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
            {line.slice(2)}
          </h1>
        );
        i++;
        continue;
      }

      // Check for markdown table
      const tableMatch = line.match(/^\|(.+)\|$/);
      if (tableMatch && !line.includes('---')) {
        const tableRows: string[] = [line];
        const headerRow = line;
        // Collect all table rows
        while (i + 1 < lines.length && lines[i + 1].match(/^\|(.+)\|$/)) {
          i++;
          tableRows.push(lines[i]);
        }
        // Check for separator row
        if (i + 1 < lines.length && lines[i + 1].match(/^[\-|:\s]+$/)) {
          i++;
          // Collect data rows
          while (i + 1 < lines.length && lines[i + 1].match(/^\|(.+)\|$/)) {
            i++;
            tableRows.push(lines[i]);
          }
        }

        const headers = headerRow.split('|').filter(c => c.trim()).map((h, idx) => (
          <th key={idx} className="px-3 py-2 text-left font-semibold bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
            {h.trim()}
          </th>
        ));

        const rows = tableRows.slice(1).map((row, rowIdx) => (
          <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700/50'}>
            {row.split('|').filter(c => c.trim()).map((cell, cellIdx) => (
              <td key={cellIdx} className="px-3 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                {cell.trim()}
              </td>
            ))}
          </tr>
        ));

        elements.push(
          <div key={i} className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-slate-200 dark:border-slate-600">
              <thead>
                <tr>{headers}</tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        );
        i++;
        continue;
      }

      // Skip table separator lines
      if (line.match(/^[\-|:\s]+$/)) {
        i++;
        continue;
      }

      // Bold text (**text**)
      const boldRegex = /\*\*(.+?)\*\*/g;
      if (boldRegex.test(line)) {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;
        while ((match = boldRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(<span key={`text-${lastIndex}`}>{line.slice(lastIndex, match.index)}</span>);
          }
          parts.push(<strong key={`bold-${match.index}`} className="font-semibold text-white">{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        if (lastIndex < line.length) {
          parts.push(<span key={`text-${lastIndex}`}>{line.slice(lastIndex)}</span>);
        }
        elements.push(<p key={i} className={`mb-2 ${textColorClass}`}>{parts}</p>);
        i++;
        continue;
      }

      // List items
      if (line.match(/^[\-\*]\s/)) {
        elements.push(
          <li key={i} className={`ml-4 mb-1 ${textColorClass} list-disc`}>
            {line.slice(2)}
          </li>
        );
        i++;
        continue;
      }
      if (line.match(/^\d+\.\s/)) {
        elements.push(
          <li key={i} className={`ml-4 mb-1 ${textColorClass} list-decimal`}>
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
        i++;
        continue;
      }

      // Empty lines
      if (line.trim() === '') {
        i++;
        continue;
      }

      // Regular paragraph
      elements.push(
        <p key={i} className={`mb-2 ${textColorClass}`}>
          {line}
        </p>
      );
      i++;
    }

    return elements;
  };

  return <div className="markdown-content">{renderContent()}</div>;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFlowchart, setShowFlowchart] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Load Mermaid script from CDN
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Render mermaid when flowchart is shown
    if (showFlowchart && typeof window !== "undefined") {
      const mermaidModule = (window as unknown as { mermaid?: { initialize: (opts: unknown) => void; run: (opts: { querySelector: string }) => Promise<void> } });
      if (mermaidModule.mermaid) {
        try {
          mermaidModule.mermaid.initialize({ startOnLoad: true });
          mermaidModule.mermaid.run({
            querySelector: ".mermaid-chart",
          });
        } catch (e) {
          console.error("Mermaid rendering error:", e);
        }
      }
    }
  }, [showFlowchart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to get response");
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            mermaidCode: data.mermaidCode,
          },
        ]);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Extract mermaid code from response
  const extractMermaidCode = (text: string): string | null => {
    // Look for mermaid code block
    const mermaidRegex = /```mermaid\s*([\s\S]*?)```/g;
    const match = mermaidRegex.exec(text);
    if (match) {
      return match[1].trim();
    }
    return null;
  };

  // Clean content by removing mermaid code block
  const cleanContent = (text: string, mermaidCode: string | null | undefined): string => {
    let cleaned = text;
    
    // Remove mermaid code block
    if (mermaidCode) {
      cleaned = cleaned.replace(/```mermaid[\s\S]*?```/g, '').trim();
    }
    
    return cleaned;
  };

  if (status === "loading") {
    return (
      <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-6 bg-slate-100 dark:bg-[#0b1220]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col bg-slate-100 dark:bg-[#0b1220]">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-white to-blue-100 dark:from-slate-900 dark:via-[#0b1220] dark:to-blue-900/40" />

      {/* Glow orbs */}
      <div className="absolute -top-56 -left-56 w-[650px] h-[650px] rounded-full blur-[120px] bg-blue-300/40 dark:bg-blue-700/20" />
      <div className="absolute top-1/4 -right-64 w-[700px] h-[700px] rounded-full blur-[140px] bg-indigo-300/35 dark:bg-indigo-800/25" />
      <div className="absolute bottom-[-200px] left-1/4 w-[520px] h-[520px] rounded-full blur-[110px] bg-cyan-300/30 dark:bg-cyan-700/20" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            AI Chat
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 flex justify-center">
              <div className="w-10 h-10 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-[20px]" />
            </div>
            <Image
              src="/logo.png"
              alt="Agento Logo"
              width={100}
              height={57}
              className="relative z-10 opacity-80"
            />
          </div>
        </div>
      </div>

      {/* Flowchart Modal */}
      {showFlowchart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                Process Flowchart
              </h3>
              <button
                onClick={() => setShowFlowchart(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(80vh-60px)]">
              <div className="mermaid-chart flex justify-center">
                {showFlowchart}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div 
        ref={chatContainerRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 py-6 space-y-4"
        style={{ maxHeight: "calc(100vh - 140px)" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
            <Bot className="w-16 h-16 text-slate-400 dark:text-slate-600" />
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
              Ask me anything about your documents
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md">
              I&apos;ll search through your uploaded documents and provide answers using AI.
              For process-related questions, I can also create flowcharts!
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const mermaidCode = msg.mermaidCode || extractMermaidCode(msg.content);
            const displayContent = cleanContent(msg.content, mermaidCode);

            return (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-500" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-slate-800 dark:bg-slate-700 text-white"
                      : "bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <MarkdownContent content={displayContent} isUser={msg.role === "user"} />
                  
                  {mermaidCode && (
                    <Button
                      onClick={() => setShowFlowchart(mermaidCode)}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                    >
                      <FileImage className="w-4 h-4" />
                      View Flowchart
                    </Button>
                  )}
                
                </div>

                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600/20 dark:bg-slate-600/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-500" />
            </div>
            <div className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg px-4 py-2">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative z-10 px-4 py-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your documents..."
              disabled={loading}
              className="flex-1 h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 pr-12"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-12 px-6 bg-slate-800 text-white dark:bg-slate-700/60 dark:text-slate-100 border border-black/10 dark:border-white/10 hover:bg-slate-700 dark:hover:bg-slate-700 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
