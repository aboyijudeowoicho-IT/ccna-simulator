"use client";

import { useState, useRef, useEffect } from "react";
import { Button, InfoBox } from "@/components/ui";
import { useStore } from "@/lib/store";
import { generateId, cn } from "@/lib/utils";
import { Send, Bot, User } from "lucide-react";
import { DEMO_CCNA_CONTENT } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
  "Explain OSPF DR/BDR election",
  "How does STP prevent loops?",
  "Walk me through subnetting 192.168.10.0/24 into 4 equal subnets",
  "What's the difference between PAT and NAT?",
  "How do trunk ports work with VLANs?",
  "Explain EIGRP DUAL algorithm",
  "What are the DHCP DORA steps?",
  "How does OSPF choose the best route?",
];

export default function TutorPage() {
  const { documents } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `👋 Hi! I'm your CCNA AI Tutor powered by Claude.\n\nAsk me anything about CCNA 200-301 — subnetting, routing protocols (OSPF, EIGRP), switching, VLANs, ACLs, WAN technologies, or network services.\n\n${documents.length > 0 ? "I'll answer using your uploaded study materials." : "I'm using built-in CCNA knowledge. Upload PDFs for material-specific answers."}`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const question = (text || input).trim();
    if (!question || loading) return;
    setInput("");

    const userMsg: Message = { id: generateId("msg"), role: "user", content: question, timestamp: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    const thinkingId = generateId("think");
    setMessages((m) => [...m, { id: thinkingId, role: "assistant", content: "...", timestamp: Date.now() }]);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history,
          contextOverride: documents.length === 0 ? DEMO_CCNA_CONTENT : undefined,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      const { answer } = await res.json();

      setMessages((m) =>
        m.map((msg) => (msg.id === thinkingId ? { ...msg, content: answer } : msg))
      );
    } catch (e) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === thinkingId
            ? { ...msg, content: `❌ Error: ${e instanceof Error ? e.message : "Failed to get response"}` }
            : msg
        )
      );
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  // Format assistant messages (bold, code blocks, line breaks)
  function formatContent(content: string) {
    if (content === "...") {
      return (
        <span className="flex gap-1 items-center">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
      );
    }

    return content.split("\n").map((line, i) => {
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/`([^`]+)`/g, '<code class="bg-bg-quaternary px-1.5 py-0.5 rounded text-brand-green font-mono text-[11px]">$1</code>');
      return (
        <p key={i} className={i > 0 ? "mt-2" : ""} dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px-48px)]">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">AI Tutor</h1>
        <p className="text-gray-400 text-sm mt-1">Ask any CCNA question — powered by Claude</p>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-900 border border-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={14} className="text-brand-blue" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-brand-blue-dark text-white rounded-tr-sm"
                    : "bg-bg-tertiary border border-border-primary text-gray-200 rounded-tl-sm"
                )}
              >
                {formatContent(msg.content)}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-bg-quaternary border border-border-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User size={14} className="text-gray-400" />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div className="px-4 py-2 border-t border-border-primary flex gap-2 overflow-x-auto shrink-0">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              disabled={loading}
              className="text-[11px] text-gray-400 hover:text-gray-200 bg-bg-tertiary hover:bg-bg-quaternary border border-border-primary rounded-full px-3 py-1 whitespace-nowrap transition-all shrink-0 disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border-primary flex gap-3 items-end shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            rows={2}
            placeholder="Ask a CCNA question… (Enter to send, Shift+Enter for new line)"
            className="flex-1 bg-bg-tertiary border border-border-primary rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 resize-none outline-none focus:border-brand-blue-dark transition-colors disabled:opacity-50 font-sans"
          />
          <Button onClick={() => send()} disabled={!input.trim() || loading} loading={loading} className="shrink-0 h-11">
            <Send size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
