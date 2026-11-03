"use client";

import React, { useState } from "react";
import {
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Terminal,
  RefreshCw,
  X,
  Zap,
  Code2,
  Cpu,
  Layers,
} from "lucide-react";
import { getHealth, HealthStatus } from "@/lib/api";

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendConnected: boolean;
  onRefreshHealth?: () => void;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({
  isOpen,
  onClose,
  backendConnected,
  onRefreshHealth,
}) => {
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [pingLatencyMs, setPingLatencyMs] = useState<number | null>(null);

  if (!isOpen) return null;

  const handlePing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const data = await getHealth();
      const latency = Math.round(performance.now() - start);
      setHealthData(data);
      setPingLatencyMs(latency);
      if (onRefreshHealth) onRefreshHealth();
    } catch (err: any) {
      setHealthData({ error: err.message });
      setPingLatencyMs(Math.round(performance.now() - start));
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-[#0c1017] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] bg-gradient-to-r from-emerald-950/40 via-[#101522] to-cyan-950/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Backend Engine &amp; API Orchestrator
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold ${
                    backendConnected
                      ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
                      : "bg-amber-950/80 border-amber-800 text-amber-300"
                  }`}
                >
                  {backendConnected ? "Online & Healthy" : "Offline Sandbox"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                OmniStore AI Dual Engine: Python FastAPI &amp; Next.js 14 App Router
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Dual Engine Architecture Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Next.js Edge API */}
            <div className="p-3.5 rounded-xl bg-[#121622] border border-cyan-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-300 text-xs flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Next.js Edge API</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400">
                Direct route handlers at <code className="text-cyan-300 font-mono">/api/v1/*</code>. Zero cold start, runs seamlessly on Vercel or locally.
              </p>
            </div>

            {/* FastAPI Engine */}
            <div className="p-3.5 rounded-xl bg-[#121622] border border-emerald-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-300 text-xs flex items-center space-x-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Python FastAPI</span>
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendConnected ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                FastAPI microservice at <code className="text-emerald-300 font-mono">:8000</code> with async queue &amp; agent memory.
              </p>
            </div>
          </div>

          {/* Quick Start Command for FastAPI */}
          <div className="p-3.5 rounded-xl bg-[#090d14] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Launch FastAPI Backend Service</span>
              </span>
              <a
                href="http://127.0.0.1:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <span>Swagger Docs (:8000/docs)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 font-mono text-[11px] text-slate-300 flex items-center justify-between">
              <code>.venv/bin/uvicorn backend.main:app --port 8000 --reload</code>
            </div>
            <p className="text-[10px] text-slate-500">
              Run this in your terminal to enable full Python multiprocessing and local Swagger documentation.
            </p>
          </div>

          {/* Endpoints Table */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Active Unified API Endpoints
            </span>
            <div className="rounded-xl border border-white/10 bg-[#090d14] overflow-hidden text-xs">
              <div className="grid grid-cols-12 px-3 py-2 border-b border-white/10 text-[10px] font-mono text-slate-400 uppercase">
                <span className="col-span-3">Method</span>
                <span className="col-span-5">Route</span>
                <span className="col-span-4">Pipeline Action</span>
              </div>
              <div className="divide-y divide-white/5 font-mono text-[11px]">
                <div className="grid grid-cols-12 px-3 py-2 items-center">
                  <span className="col-span-3 text-emerald-400 font-bold">POST</span>
                  <span className="col-span-5 text-slate-300">/api/v1/scan/json</span>
                  <span className="col-span-4 text-slate-400 text-[10px]">End-to-End Scan</span>
                </div>
                <div className="grid grid-cols-12 px-3 py-2 items-center">
                  <span className="col-span-3 text-cyan-400 font-bold">POST</span>
                  <span className="col-span-5 text-slate-300">/api/v1/segment</span>
                  <span className="col-span-4 text-slate-400 text-[10px]">SAM 3.1 Vision</span>
                </div>
                <div className="grid grid-cols-12 px-3 py-2 items-center">
                  <span className="col-span-3 text-purple-400 font-bold">POST</span>
                  <span className="col-span-5 text-slate-300">/api/v1/reason</span>
                  <span className="col-span-4 text-slate-400 text-[10px]">Muse Spark 1.3</span>
                </div>
                <div className="grid grid-cols-12 px-3 py-2 items-center">
                  <span className="col-span-3 text-amber-400 font-bold">POST</span>
                  <span className="col-span-5 text-slate-300">/api/v1/code/generate</span>
                  <span className="col-span-4 text-slate-400 text-[10px]">Muse Code AST</span>
                </div>
                <div className="grid grid-cols-12 px-3 py-2 items-center">
                  <span className="col-span-3 text-purple-400 font-bold">POST</span>
                  <span className="col-span-5 text-slate-300">/api/v1/meta/validate</span>
                  <span className="col-span-4 text-slate-400 text-[10px]">Validate Key</span>
                </div>
                <div className="grid grid-cols-12 px-3 py-2 items-center">
                  <span className="col-span-3 text-blue-400 font-bold">GET</span>
                  <span className="col-span-5 text-slate-300">/api/v1/health</span>
                  <span className="col-span-4 text-slate-400 text-[10px]">Health Check</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Ping Test Output */}
          {healthData && (
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>Health Ping Telemetry</span>
                {pingLatencyMs !== null && (
                  <span className="text-emerald-400">{pingLatencyMs}ms roundtrip</span>
                )}
              </div>
              <pre className="text-slate-300 text-[10px] overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#090d14] flex items-center justify-between">
          <button
            type="button"
            disabled={isPinging}
            onClick={handlePing}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#141926] hover:bg-[#1c2438] text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? "animate-spin" : ""}`} />
            <span>Ping Backend Now</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
