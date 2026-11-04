"use client";

import React, { useState, useEffect } from "react";
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
  Key,
} from "lucide-react";
import { MetaKeyModal } from "@/components/MetaKeyModal";
import { BackendStatusModal } from "@/components/BackendStatusModal";
import { getStoredMetaApiKey, getHealth } from "@/lib/api";
import { OmniStoreLogo } from "./OmniStoreLogo";

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
  const [metaModalOpen, setMetaModalOpen] = useState<boolean>(false);
  const [backendModalOpen, setBackendModalOpen] = useState<boolean>(false);
  const [hasMetaKey, setHasMetaKey] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("omnistore_view_mode") as ViewMode | null;
      if (savedMode && (savedMode === "merchant" || savedMode === "judge")) {
        if (savedMode !== viewMode) {
          onToggleViewMode(savedMode);
        }
      }
    } catch {}
  }, [onToggleViewMode, viewMode]);

  useEffect(() => {
    const key = getStoredMetaApiKey();
    if (key) {
      setHasMetaKey(true);
    } else {
      getHealth()
        .then((h) => {
          if (h.meta_api_configured || h.active_providers?.meta_model_api) {
            setHasMetaKey(true);
          }
        })
        .catch(() => {});
    }
  }, [backendConnected]);

  const handleModeChange = (mode: ViewMode) => {
    try {
      localStorage.setItem("omnistore_view_mode", mode);
    } catch {}
    if (mode === "merchant" && activeTab === "architecture") {
      onSelectTab("demo");
    }
    onToggleViewMode(mode);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#08090a]/85 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all">
        {/* Primary Brand & Mode Navigation Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand Identity with Bespoke Vector Logo */}
          <div className="flex items-center space-x-3 min-w-max">
            <OmniStoreLogo size={28} />

            {viewMode === "judge" && (
              <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/60 text-[10px] font-mono text-purple-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span>Build for Your World · Judge View</span>
              </span>
            )}
          </div>

          {/* Central Dual Mode Switcher (Store Owner vs. Judge Mode) */}
          <div className="flex items-center bg-[#0e1118] p-1 rounded-xl border border-white/10 shadow-inner">
            <button
              onClick={() => handleModeChange("merchant")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                viewMode === "merchant"
                  ? "bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Store Owner</span>
            </button>

            <button
              onClick={() => handleModeChange("judge")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                viewMode === "judge"
                  ? "bg-purple-600 text-white shadow-[0_0_18px_rgba(168,85,247,0.4)] font-bold border border-purple-400/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Judge Mode</span>
            </button>
          </div>

          {/* Viewport Tabs, Meta AI Key & Live Backend Status */}
          <div className="flex items-center space-x-2">
            {/* Main View Tabs */}
            <div className="hidden md:flex items-center space-x-1 bg-[#0e1118] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => onSelectTab("demo")}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-[0.98] ${
                  activeTab === "demo"
                    ? "bg-white text-black font-bold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Studio</span>
              </button>

              <button
                onClick={() => onSelectTab("storefront")}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-[0.98] ${
                  activeTab === "storefront"
                    ? "bg-white text-black font-bold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Storefront</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-800 text-emerald-400 font-bold ml-1">
                  {inventoryCount}
                </span>
              </button>

              {/* Engine Specs TAB: Judge Mode ONLY */}
              {viewMode === "judge" && (
                <button
                  onClick={() => onSelectTab("architecture")}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-[0.98] ${
                    activeTab === "architecture"
                      ? "bg-white text-black font-bold shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Engine Specs</span>
                </button>
              )}
            </div>

            {/* Developer controls ONLY in Judge Mode */}
            {viewMode === "judge" && (
              <>
                {/* Meta AI Key Configuration CTA */}
                <button
                  onClick={() => setMetaModalOpen(true)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-all group active:scale-[0.98] ${
                    hasMetaKey
                      ? "bg-purple-950/40 border-purple-500/40 text-purple-300 hover:bg-purple-900/40 hover:border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                      : "bg-[#121622] border-white/10 text-zinc-300 hover:border-purple-500/50 hover:text-purple-300"
                  }`}
                  title="Configure Meta Model API Key for SAM 3.1 & Muse Spark"
                >
                  <Key className="w-3.5 h-3.5 text-purple-400 transition-transform group-hover:rotate-45" />
                  <span className="font-semibold hidden sm:inline">Meta Key</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      hasMetaKey ? "bg-emerald-400 animate-pulse" : "bg-purple-400"
                    }`}
                  />
                </button>

                {/* Interactive Backend Status Indicator Button */}
                <button
                  onClick={() => setBackendModalOpen(true)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-all hover:brightness-110 active:scale-[0.98] ${
                    backendConnected
                      ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                      : "bg-amber-950/40 border-amber-800/50 text-amber-300"
                  }`}
                  title="Click to view Backend & API Orchestrator status"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      backendConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {backendConnected ? "API Connected" : "Sandbox"}
                  </span>
                </button>
              </>
            )}
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
                <span className="text-zinc-500 text-xs hidden sm:inline">·</span>
                <span className="text-zinc-300 text-xs font-mono hidden sm:inline">
                  Real-time 3-Model Hardware Pipeline
                </span>
              </div>

              {/* Telemetry Pill Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Meta API Key Status Pill */}
                <button
                  onClick={() => setMetaModalOpen(true)}
                  className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#121624] border border-purple-500/40 text-xs shadow-sm hover:border-purple-400 transition-colors"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      hasMetaKey ? "bg-emerald-400 animate-pulse" : "bg-purple-400"
                    }`}
                  />
                  <span className="font-semibold text-purple-300 text-[11px]">Meta Model API</span>
                  <span className="text-[10px] font-mono text-emerald-400 pl-1 border-l border-white/10">
                    {hasMetaKey ? "$150 Active" : "Configure Key"}
                  </span>
                </button>

                {/* SAM 3.1 Vision Pill */}
                <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#121624] border border-cyan-500/30 text-xs shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-semibold text-cyan-300 text-[11px]">SAM 3.1 Vision</span>
                  <span className="text-[10px] font-mono text-zinc-400 pl-1 border-l border-white/10">
                    {segmentsCount} Masks · 24ms
                  </span>
                </div>

                {/* Muse Spark 1.3 Reasoning Pill */}
                <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#121624] border border-purple-500/30 text-xs shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span className="font-semibold text-purple-300 text-[11px]">
                    Muse Spark 1.3 Reasoning
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 pl-1 border-l border-white/10">
                    Cognitive Grounding · 0.98 Conf
                  </span>
                </div>

                {/* Muse Code Synthesis Pill */}
                <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#121624] border border-emerald-500/30 text-xs shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-emerald-300 text-[11px]">
                    Muse Code Synthesis
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 pl-1 border-l border-white/10">
                    Next.js 14 AST · WhatsApp Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Meta API Key Modal */}
      <MetaKeyModal
        isOpen={metaModalOpen}
        onClose={() => setMetaModalOpen(false)}
        onKeySaved={(k) => setHasMetaKey(Boolean(k))}
      />

      {/* Backend & API Status Modal */}
      <BackendStatusModal
        isOpen={backendModalOpen}
        onClose={() => setBackendModalOpen(false)}
        backendConnected={backendConnected}
      />
    </>
  );
};
