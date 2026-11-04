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
      {/* Sole Primary Navigation Bar — Zero Stacking / Zero Duplicate Navbars */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#090b10]/95 backdrop-blur-xl shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Brand Identity with Interlocking "O" Logo */}
          <div className="flex items-center space-x-3 min-w-max">
            <OmniStoreLogo size={32} />

            {viewMode === "judge" && (
              <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#6a3f49]/30 border border-[#6a3f49]/60 text-[10px] font-mono text-[#cab695] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c1793f] animate-pulse" />
                <span>Meta AI Telemetry Mode</span>
              </span>
            )}
          </div>

          {/* Central E-Commerce Viewport Tabs */}
          <div className="flex items-center bg-[#12151e] p-1 rounded-xl border border-white/10 shadow-inner">
            <button
              onClick={() => onSelectTab("demo")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                activeTab === "demo"
                  ? "bg-[#c1793f] text-white shadow-sm font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Stall Studio</span>
            </button>

            <button
              onClick={() => onSelectTab("storefront")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                activeTab === "storefront"
                  ? "bg-[#c1793f] text-white shadow-sm font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Live Store</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-[#cab695] font-bold ml-1">
                {inventoryCount}
              </span>
            </button>

            {/* Engine Specs Tab: Judge Mode Only */}
            {viewMode === "judge" && (
              <button
                onClick={() => onSelectTab("architecture")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                  activeTab === "architecture"
                    ? "bg-[#6a3f49] text-white shadow-sm font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Engine Specs</span>
              </button>
            )}
          </div>

          {/* Right Mode Switch & Key Controls */}
          <div className="flex items-center space-x-2">
            {/* View Mode Switcher (Store Owner vs. Judge) */}
            <div className="flex items-center bg-[#12151e] p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => handleModeChange("merchant")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                  viewMode === "merchant"
                    ? "bg-zinc-800 text-white font-bold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Store Owner
              </button>
              <button
                onClick={() => handleModeChange("judge")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                  viewMode === "judge"
                    ? "bg-[#6a3f49] text-white font-bold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Judge Mode
              </button>
            </div>

            {/* Developer Controls: Judge Mode Only */}
            {viewMode === "judge" && (
              <button
                onClick={() => setMetaModalOpen(true)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all active:scale-[0.98] ${
                  hasMetaKey
                    ? "bg-[#6a3f49]/30 border-[#6a3f49]/60 text-[#cab695]"
                    : "bg-[#12151e] border-white/10 text-zinc-300 hover:border-[#c1793f]"
                }`}
                title="Configure Meta Model API Key"
              >
                <Key className="w-3 h-3 text-[#c1793f]" />
                <span className="hidden sm:inline">Meta Key</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasMetaKey ? "bg-[#10b981] animate-pulse" : "bg-[#c1793f]"
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Strip: Judge Mode ONLY */}
        {viewMode === "judge" && (
          <div className="border-t border-[#6a3f49]/30 bg-[#12151e]/80 px-4 sm:px-6 py-2 transition-all animate-fadeIn">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
              <div className="flex items-center space-x-2 text-zinc-400">
                <Terminal className="w-3.5 h-3.5 text-[#c1793f]" />
                <span className="text-[#cab695] font-semibold">Meta Tri-Model Pipeline:</span>
                <span className="hidden sm:inline">SAM 3.1 (Perception) → Muse Spark (Pricing) → Muse Code (PWA)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] text-zinc-300">
                  SAM 3.1: {segmentsCount} SKUs
                </span>
                <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] text-zinc-300">
                  Latency: {processingTimeMs}ms
                </span>
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
