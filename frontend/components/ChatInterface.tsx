"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Terminal,
  Code,
  Compass,
  Monitor,
  Zap,
  StopCircle,
} from "lucide-react";
import { ChatMessage, streamAgentChat, SquadRoleInfo } from "@/lib/api";

interface ChatInterfaceProps {
  activeRole: string;
  onSelectRole: (role: string) => void;
  roles: SquadRoleInfo[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  activeRole,
  onSelectRole,
  roles,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your OmniStore AI Advisor. I can assist with SAM 3.1 visual segmentation, Muse Spark pricing formulas in local currency, or Muse Code storefront code generation. How can I assist your market stall today?",
      agent_role: "commander",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingDelta, setStreamingDelta] = useState("");
  const abortRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingDelta]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isStreaming) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const newHistory = [...messages, userMessage];

    setMessages(newHistory);
    setInputValue("");
    setIsStreaming(true);
    setStreamingDelta("");

    let currentResponse = "";

    const stopFn = await streamAgentChat({
      messages: newHistory,
      agentRole: activeRole,
      onToken: (token) => {
        currentResponse += token;
        setStreamingDelta(currentResponse);
      },
      onFinish: (role) => {
        setIsStreaming(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: currentResponse,
            agent_role: role,
          },
        ]);
        setStreamingDelta("");
        abortRef.current = null;
      },
      onError: (err) => {
        console.error("Chat streaming error:", err);
        setIsStreaming(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `[System Error]: ${err.message}`,
            agent_role: "commander",
          },
        ]);
        setStreamingDelta("");
        abortRef.current = null;
      },
    });

    abortRef.current = stopFn;
  };

  const handleStopStream = () => {
    if (abortRef.current) {
      abortRef.current();
      setIsStreaming(false);
      if (streamingDelta) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: streamingDelta + " [Stream Interrupted]",
            agent_role: activeRole,
          },
        ]);
      }
      setStreamingDelta("");
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "planner":
        return <Compass className="w-3.5 h-3.5 text-amber-400" />;
      case "coder":
        return <Code className="w-3.5 h-3.5 text-emerald-400" />;
      case "researcher":
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case "desktop":
        return <Monitor className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Bot className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const quickPrompts = [
    "Run SAM 3.1 visual segmentation on the stall shelves.",
    "Calculate fair Nigerian Naira pricing for white garri and yams.",
    "Inspect synthesized Next.js 14 WhatsApp checkout route.",
    "Recommend marketing strategies for local kiosk customers.",
  ];

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] rounded-2xl border border-white/[0.08] p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-xs text-slate-100 uppercase font-mono">
            OmniStore Agentic Advisor
          </h2>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300">
            {activeRole.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Role Switcher Pill Bar */}
      <div className="flex items-center space-x-1.5 py-2 overflow-x-auto no-scrollbar border-b border-white/[0.05]">
        {roles.map((r) => (
          <button
            key={r.role}
            onClick={() => onSelectRole(r.role)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all ${
              activeRole === r.role
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "bg-[#121622] text-slate-400 hover:text-slate-200"
            }`}
          >
            {getRoleIcon(r.role)}
            <span>{r.name}</span>
          </button>
        ))}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto space-y-3.5 my-3 pr-1 no-scrollbar">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex items-start space-x-2.5 ${
                isUser ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isUser
                    ? "bg-emerald-500 text-slate-950 font-bold text-xs shadow-sm"
                    : "bg-[#141924] border border-white/10 text-emerald-400"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : getRoleIcon(msg.agent_role)}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-[#121622] border border-white/[0.08] text-slate-200"
                }`}
              >
                {!isUser && msg.agent_role && (
                  <div className="text-[10px] font-mono text-emerald-400 mb-1 flex items-center space-x-1">
                    <span>OMNISTORE {msg.agent_role.toUpperCase()}</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          );
        })}

        {/* Live Streaming Delta Bubble */}
        {isStreaming && (
          <div className="flex items-start space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#141924] border border-white/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="max-w-[85%] bg-[#121622] border border-emerald-500/30 rounded-2xl px-3.5 py-2.5 text-xs text-slate-200 shadow-md">
              <div className="text-[10px] font-mono text-emerald-400 mb-1">
                STREAMING TOKEN PIPELINE...
              </div>
              <div className="whitespace-pre-wrap">
                {streamingDelta}
                <span className="animate-cursor" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="py-2 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((promptText, i) => (
          <button
            key={i}
            onClick={() => handleSend(promptText)}
            className="text-[10px] font-mono bg-[#121622] hover:bg-[#182030] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-white/5 whitespace-nowrap transition-colors"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="pt-2 border-t border-white/[0.08] flex items-center space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask Meta AI models anything about this market stall..."
          className="flex-1 bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />

        {isStreaming ? (
          <button
            onClick={handleStopStream}
            className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-sm transition-colors"
            title="Stop Generation"
          >
            <StopCircle className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim()}
            className="btn-command-emerald p-2 rounded-xl text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
