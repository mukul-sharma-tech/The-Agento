"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Loader2, Bot, User, ArrowLeft, X, FileImage, Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Trash2 } from "lucide-react";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
  mermaidCode?: string;
}

function removeEmojis(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\.\.\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

function speakText(text: string, onEnd: () => void) {
  if (typeof window !== "undefined" && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    const cleanText = removeEmojis(text);
    if (!cleanText) {
      onEnd();
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.onend = () => {
      onEnd();
    };
    
    utterance.onerror = () => {
      onEnd();
    };
    
    window.speechSynthesis.speak(utterance);
  } else {
    onEnd();
  }
}

function stopSpeaking() {
  if (typeof window !== "undefined" && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function MarkdownContent({ content, isUser = false }: { content: string; isUser?: boolean }) {
  const textColorClass = isUser ? "text-white" : "text-gray-300";
  
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.includes('```mermaid')) {
        i++;
        continue;
      }

      if (line.startsWith('```') || line.startsWith('`')) {
        i++;
        continue;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className={`text-lg font-semibold mt-3 mb-2 ${isUser ? "text-white" : "text-white"}`}>
            {line.slice(4)}
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className={`text-xl font-semibold mt-3 mb-2 ${isUser ? "text-white" : "text-white"}`}>
            {line.slice(3)}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className={`text-2xl font-bold mt-3 mb-2 ${isUser ? "text-white" : "text-white"}`}>
            {line.slice(2)}
          </h1>
        );
        i++;
        continue;
      }

      const tableMatch = line.match(/^\|(.+)\|$/);
      if (tableMatch && !line.includes('---')) {
        const tableRows: string[] = [line];
        const headerRow = line;
        while (i + 1 < lines.length && lines[i + 1].match(/^\|(.+)\|$/)) {
          i++;
          tableRows.push(lines[i]);
        }
        if (i + 1 < lines.length && lines[i + 1].match(/^[\-|:\s]+$/)) {
          i++;
          while (i + 1 < lines.length && lines[i + 1].match(/^\|(.+)\|$/)) {
            i++;
            tableRows.push(lines[i]);
          }
        }

        const headers = headerRow.split('|').filter(c => c.trim()).map((h, idx) => (
          <th key={idx} className="px-3 py-2 text-left font-semibold bg-gray-700 border border-gray-600">
            {h.trim()}
          </th>
        ));

        const rows = tableRows.slice(1).map((row, rowIdx) => (
          <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700/50'}>
            {row.split('|').filter(c => c.trim()).map((cell, cellIdx) => (
              <td key={cellIdx} className="px-3 py-2 border border-gray-600 text-gray-300">
                {cell.trim()}
              </td>
            ))}
          </tr>
        ));

        elements.push(
          <div key={i} className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-gray-600">
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

      if (line.match(/^[\-|:\s]+$/)) {
        i++;
        continue;
      }

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

      if (line.trim() === '') {
        i++;
        continue;
      }

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

export default function VoiceCallPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFlowchart, setShowFlowchart] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("Ready");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (showFlowchart && typeof window !== "undefined") {
      const mermaidModule = (window as unknown as { mermaid?: { initialize: (opts: unknown) => void; run: (opts: { querySelector: string }) => Promise<void> } });
      if (mermaidModule.mermaid) {
        try {
          mermaidModule.mermaid.initialize({ startOnLoad: true });
          mermaidModule.mermaid.run({
            querySelector: ".mermaid-chart",
          });
        } catch (e) {
          console.error("Mermaid error:", e);
        }
      }
    }
  }, [showFlowchart]);

  useEffect(() => {
    if (typeof window !== "undefined" && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setCallStatus("Listening");
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentInput = finalTranscript || interimTranscript;
        setInput(currentInput);

        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        if (currentInput.trim().length > 0) {
          silenceTimeoutRef.current = setTimeout(() => {
            if (currentInput.trim()) {
              handleVoiceSubmit(currentInput.trim());
            }
          }, 1500);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'no-speech') {
        } else if (event.error === 'not-allowed') {
          setError("Microphone access denied");
          endCall();
        } else {
          setIsListening(false);
          setCallStatus("Error");
        }
      };

      recognitionRef.current.onend = () => {
        if (isInCall && isListening) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error("Restart error:", e);
          }
        }
      };
    }

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isInCall]);

  // Auto-mute mic when AI speaks
  useEffect(() => {
    if (isSpeaking && isInCall && recognitionRef.current && isListening) {
      // Stop speech recognition when AI starts speaking
      recognitionRef.current.stop();
      setIsListening(false);
    } else if (!isSpeaking && isInCall && !isListening && recognitionRef.current) {
      // Restart speech recognition when AI stops speaking
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Auto-restart error:", e);
      }
    }
  }, [isSpeaking, isInCall, isListening]);

  const startCall = () => {
    if (recognitionRef.current) {
      try {
        setIsInCall(true);
        setMessages([]);
        setCallStatus("Listening");
        setInput("");
        recognitionRef.current.start();
      } catch (e) {
        console.error("Start call error:", e);
        setError("Failed to start call. Check microphone permissions.");
      }
    } else {
      setError("Speech recognition not supported in this browser");
    }
  };

  const endCall = () => {
    stopSpeaking();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    setIsInCall(false);
    setIsListening(false);
    setIsSpeaking(false);
    setCallStatus("Ready");
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  const handleVoiceSubmit = async (text: string) => {
    if (!text.trim() || loading) return;

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    const userMessage = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setCallStatus("Processing");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          mode: "voice", // Voice mode for shorter responses
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to get response");
        setCallStatus("Error");
        if (isInCall && recognitionRef.current) {
          recognitionRef.current.start();
        }
      } else {
        setIsSpeaking(true);
        setCallStatus("Speaking");
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            mermaidCode: data.mermaidCode,
          },
        ]);

        if (!isMuted) {
          speakText(data.message, () => {
            setIsSpeaking(false);
            if (isInCall && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error("Restart error:", e);
              }
            }
          });
        } else {
          setIsSpeaking(false);
          if (isInCall && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error("Restart error:", e);
            }
          }
        }
      }
    } catch {
      setError("Something went wrong.");
      setCallStatus("Error");
      if (isInCall && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Restart error:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const extractMermaidCode = (text: string): string | null => {
    const mermaidRegex = /```mermaid\s*([\s\S]*?)```/g;
    const match = mermaidRegex.exec(text);
    if (match) {
      return match[1].trim();
    }
    return null;
  };

  const cleanContent = (text: string, mermaidCode: string | null | undefined): string => {
    let cleaned = text;
    if (mermaidCode) {
      cleaned = cleaned.replace(/```mermaid[\s\S]*?```/g, '').trim();
    }
    return cleaned;
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
        <button
          onClick={() => { endCall(); router.push("/dashboard"); }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h1 className="text-lg font-semibold text-white">
            Voice AI
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-400 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Flowchart Modal */}
      {showFlowchart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-700/50">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                Flowchart
              </h3>
              <button
                onClick={() => setShowFlowchart(null)}
                className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[60vh] bg-gray-100">
              <div className="mermaid-chart flex justify-center">
                {showFlowchart}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content - Equal width columns */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column - Globe & Controls */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 border-r border-gray-700 bg-gray-800/30">
          
          {/* Globe */}
          <div className="relative w-80 h-80 flex-shrink-0 mb-6">
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'scale-110' : isListening ? 'scale-105' : 'scale-100'}`}>
              <Image
                src="/globe.gif"
                alt="AI"
                width={400}
                height={400}
                className={`${isSpeaking ? 'animate-spin-slow' : isListening ? 'animate-pulse' : ''} rounded-full opacity-90`}
                style={{ 
                  filter: isSpeaking 
                    ? 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.8))' 
                    : isListening 
                    ? 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))'
                    : 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))'
                }}
              />
            </div>
          </div>

          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-full text-sm font-medium mb-6 flex-shrink-0 ${
            isListening ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            isSpeaking ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            isInCall ? 'bg-gray-700 text-gray-300 border border-gray-600' :
            'bg-gray-800 text-gray-400 border border-gray-700'
          }`}>
            {callStatus}
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-4 flex-shrink-0">
            {!isInCall ? (
              <Button
                onClick={startCall}
                className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 transition-all"
              >
                <Phone className="w-7 h-7" />
              </Button>
            ) : (
              <>
                <Button
                  onClick={endCall}
                  className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30 transition-all"
                >
                  <PhoneOff className="w-7 h-7" />
                </Button>
                
                {isSpeaking && (
                  <Button
                    onClick={stopSpeaking}
                    className="h-12 w-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30 transition-all"
                  >
                    <VolumeX className="w-6 h-6" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Mic Indicator */}
          {isInCall && (
            <div className="mt-6 flex items-center gap-2 flex-shrink-0">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-gray-400 text-sm">
                {isListening ? 'Mic On' : 'Mic Off'}
              </span>
            </div>
          )}
        </div>

        {/* Right Column - Chat */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-900">
          
          {/* Chat Header */}
          <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/50">
            <h2 className="text-white font-medium">Conversation</h2>
            {messages.length > 0 && (
              <Button
                onClick={clearChat}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
          >
            
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 min-h-[200px]">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  Start a call to begin
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const mermaidCode = msg.mermaidCode || extractMermaidCode(msg.content);
                const displayContent = cleanContent(msg.content, mermaidCode);

                return (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-blue-400" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-200 border border-gray-700"
                      }`}
                    >
                      <MarkdownContent content={displayContent} isUser={msg.role === "user"} />
                      
                      {mermaidCode && (
                        <Button
                          onClick={() => setShowFlowchart(mermaidCode)}
                          className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                        >
                          <FileImage className="w-4 h-4" />
                          View Flowchart
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
                <div className="bg-red-900/30 text-red-400 rounded-lg px-4 py-2 border border-red-800">
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
