"use client";

import React from "react";
import {
  Store,
  Sparkles,
  Smartphone,
  Code2,
  Cpu,
  Layers,
  Terminal,
  Activity,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Zap,
} from "lucide-react";

export type ViewMode = "merchant" | "judge";
export type ActiveTab = "demo" | "storefront" | "architecture";

interface ModeToggleHeaderProps {
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  backendConnected: boolean;
  inventoryCount: number;
  segmentsCount?: number;
  processingTimeMs?: number;
}

export const ModeToggleHeader: React.FC<ModeToggleHeaderProps> = ({
  viewMode,
  onToggleViewMode,
  activeTab,
  onSelectTab,
  backendConnected,
  inventoryCount,
  segmentsCount = 6,
  processingTimeMs = 380,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080a0f]/90 backdrop-blur-xl">
      {/* Primary Brand & Mode Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center space-x-3 min-w-max">
          <div className="relative group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Store className="w-4 h-4 transition-transform group-hover:scale-110" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#080a0f] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-tight text-white flex items-center space-x-1.5">
                <span>OmniStore</span>
                <span className="text-emerald-400 font-mono font-normal">AI</span>
              </span>

              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-[10px] font-mono text-emerald-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Build for Your World</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Physical-to-Digital Micro-Commerce Engine · Meta Global AI Hackathon
            </p>
          </div>
        </div>

        {/* Central Dual Mode Switcher (Store Owner vs. Judge / Meta AI Mode) */}
        <div className="flex items-center bg-[#10141d] p-1 rounded-xl border border-white/10 shadow-inner">
          <button
            onClick={() => onToggleViewMode("merchant")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "merchant"
                ? "bg-emerald-500 text-slate-950 shadow-md font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Store Owner View</span>
          </button>

          <button
            onClick={() => onToggleViewMode("judge")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "judge"
                ? "bg-purple-600 text-white shadow-[0_0_18px_rgba(168,85,247,0.4)] font-bold border border-purple-400/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Judge / Meta AI Mode</span>
          </button>
        </div>

        {/* Viewport Tabs & Live Backend Status */}
        <div className="flex items-center space-x-2">
          {/* Main View Tabs */}
          <div className="hidden md:flex items-center space-x-1 bg-[#10141d] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => onSelectTab("demo")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === "demo"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Studio</span>
            </button>

            <button
              onClick={() => onSelectTab("storefront")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === "storefront"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Storefront</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400 font-bold ml-1">
                {inventoryCount}
              </span>
            </button>

            <button
              onClick={() => onSelectTab("architecture")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === "architecture"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Engine Specs</span>
            </button>
          </div>

          {/* Backend Status indicator */}
          <div
            className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono ${
              backendConnected
                ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
                : "bg-amber-950/40 border-amber-800/50 text-amber-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span>{backendConnected ? "FastAPI Live" : "Offline Sandbox"}</span>
          </div>
        </div>
      </div>

      {/* JUDGE / META AI TELEMETRY STRIP (Rendered specifically in Judge Mode) */}
      {viewMode === "judge" && (
        <div className="border-t border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-[#0d101a]/80 to-purple-950/40 px-4 sm:px-6 py-2 transition-all animate-fadeIn">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-200 uppercase tracking-wider flex items-center space-x-1">
                <Terminal className="w-3 h-3 text-purple-300" />
                <span>Meta AI Telemetry Stream</span>
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">·</span>
              <span className="text-slate-300 text-xs font-mono hidden sm:inline">
                Real-time 3-Model Hardware Pipeline
              </span>
            </div>

            {/* Telemetry pill badges */}
            <div className="flex flex-wrap items-center gap-2">
              {/* SAM 3.1 Vision Pill */}
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#121624] border border-cyan-500/30 text-xs shadow-sm">
                <span className="status-dot status-dot-cyan" />
                <span className="font-semibold text-cyan-300 text-[11px]">SAM 3.1 Vision</span>
                <span className="text-[10px] font-mono text-slate-400 pl-1 border-l border-white/10">
                  {segmentsCount} Masks · 24ms
                </span>
              </div>

              {/* Muse Spark 1.3 Reasoning Pill */}
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#121624] border border-purple-500/30 text-xs shadow-sm">
                <span className="status-dot status-dot-purple" />
                <span className="font-semibold text-purple-300 text-[11px]">
                  Muse Spark 1.3 Reasoning
                </span>
                <span className="text-[10px] font-mono text-slate-400 pl-1 border-l border-white/10">
                  Cognitive Grounding · 0.98 Conf
                </span>
              </div>

              {/* Muse Code Synthesis Pill */}
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#121624] border border-emerald-500/30 text-xs shadow-sm">
                <span className="status-dot status-dot-emerald" />
                <span className="font-semibold text-emerald-300 text-[11px]">
                  Muse Code Synthesis
                </span>
                <span className="text-[10px] font-mono text-slate-400 pl-1 border-l border-white/10">
                  Next.js 14 AST · WhatsApp Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
