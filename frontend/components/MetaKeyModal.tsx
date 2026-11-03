"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Cpu,
  RefreshCw,
  X,
  Layers,
  Terminal,
} from "lucide-react";
import {
  getStoredMetaApiKey,
  setStoredMetaApiKey,
  validateMetaApiKey,
} from "@/lib/api";

interface MetaKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (key: string) => void;
}

export const MetaKeyModal: React.FC<MetaKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
}) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    models?: string[];
  }>({
    status: "idle",
    message: "",
  });

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredMetaApiKey();
      setApiKey(stored);
      if (stored) {
        setValidationResult({
          status: "success",
          message: "API Key loaded from local environment / storage.",
          models: ["sam-3.1", "muse-spark-1.3", "muse-code"],
        });
      } else {
        setValidationResult({
          status: "idle",
          message: "",
        });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setValidationResult({
        status: "error",
        message: "Please enter your Meta Model API key first.",
      });
      return;
    }

    setIsValidating(true);
    setValidationResult({ status: "idle", message: "" });

    try {
      const res = await validateMetaApiKey(apiKey.trim());
      if (res.valid) {
        setValidationResult({
          status: "success",
          message: res.message || "Key verified! Meta Model API credits active.",
          models: res.models || ["sam-3.1", "muse-spark-1.3", "muse-code"],
        });
        setStoredMetaApiKey(apiKey.trim());
        if (onKeySaved) onKeySaved(apiKey.trim());
      } else {
        setValidationResult({
          status: "error",
          message: res.message || "Authentication failed. Please verify your token on dev.meta.ai.",
        });
      }
    } catch (err: any) {
      setValidationResult({
        status: "error",
        message: err.message || "Failed to validate key. Check network connection.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    setStoredMetaApiKey(apiKey.trim());
    if (onKeySaved) onKeySaved(apiKey.trim());
    onClose();
  };

  const handleUseMock = () => {
    const mock = "mock_meta_hackathon_token_150credits";
    setApiKey(mock);
    setStoredMetaApiKey(mock);
    setValidationResult({
      status: "success",
      message: "Sandbox Demo Key configured with simulated $150 credits.",
      models: ["sam-3.1", "muse-spark-1.3", "muse-code"],
    });
    if (onKeySaved) onKeySaved(mock);
  };

  const handleClear = () => {
    setApiKey("");
    setStoredMetaApiKey("");
    setValidationResult({
      status: "idle",
      message: "Key cleared. App will run in sandbox mode.",
    });
    if (onKeySaved) onKeySaved("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-[#0c1017] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/[0.08] bg-gradient-to-r from-purple-950/40 via-[#101522] to-emerald-950/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Meta Model API Key &amp; Credentials
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800 text-[10px] font-mono text-purple-300 font-semibold">
                  $150 Credit Grant
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Meta Global AI Developer Hackathon · Build for Your World
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Hackathon Guide Banner */}
          <div className="p-3.5 rounded-xl bg-[#121724] border border-purple-500/20 text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-purple-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Meta AI Hackathon Requirements</span>
              </span>
              <a
                href="https://dev.meta.ai"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <span>dev.meta.ai</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your API key unlocks live inference across Meta's models:{" "}
              <strong className="text-cyan-300">SAM 3.1</strong> (spatial vision &amp; masks),{" "}
              <strong className="text-purple-300">Muse Spark 1.3</strong> (multimodal market pricing), and{" "}
              <strong className="text-emerald-300">Muse Code</strong> (Next.js storefront code synthesis).
            </p>
            <div className="pt-1 flex items-center space-x-3 text-[11px]">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLScam78z7tHsNYibiFyJQVFzEgr0coyBTiY568SxxNbsPa3jiw/viewform"
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:underline font-mono"
              >
                Claim $150 Credits Form →
              </a>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 font-mono">Header: Authorization: Bearer &lt;key&gt;</span>
            </div>
          </div>

          {/* Key Input Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>META_MODEL_API_KEY</span>
              {apiKey && (
                <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Stored Locally in Browser</span>
                </span>
              )}
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your Meta Model API key (e.g. meta_...)"
                className="w-full px-3.5 py-2.5 bg-[#090d14] border border-white/10 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 pr-20"
              />
              <div className="absolute right-2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded-lg"
                  title={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Validation Feedback */}
          {validationResult.status !== "idle" && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
                validationResult.status === "success"
                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                  : "bg-red-950/40 border-red-800/60 text-red-300"
              }`}
            >
              {validationResult.status === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-medium text-[11px]">{validationResult.message}</p>
                {validationResult.models && validationResult.models.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {validationResult.models.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 rounded bg-black/40 border border-emerald-500/30 text-[10px] font-mono text-emerald-300"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Model Stack Telemetry */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Configured Meta AI Pipeline Stack
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#0e121c] border border-cyan-500/20 space-y-1">
                <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-[11px]">
                  <Cpu className="w-3 h-3" />
                  <span>Eyes: SAM 3.1</span>
                </div>
                <p className="text-[10px] text-slate-400">Zero-shot stall &amp; shelf segmentation</p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0e121c] border border-purple-500/20 space-y-1">
                <div className="flex items-center space-x-1.5 text-purple-400 font-semibold text-[11px]">
                  <Sparkles className="w-3 h-3" />
                  <span>Brain: Muse Spark 1.3</span>
                </div>
                <p className="text-[10px] text-slate-400">Emerging market localized NGN pricing</p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0e121c] border border-emerald-500/20 space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-[11px]">
                  <Terminal className="w-3 h-3" />
                  <span>Hands: Muse Code</span>
                </div>
                <p className="text-[10px] text-slate-400">Autonomous web storefront synthesizer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#090d14] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleUseMock}
              className="px-3 py-1.5 text-[11px] text-slate-400 hover:text-slate-200 border border-white/10 rounded-lg hover:bg-white/5 transition-colors font-mono"
            >
              Load Sandbox Key
            </button>
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 text-[11px] text-red-400 hover:text-red-300 border border-red-900/40 rounded-lg hover:bg-red-950/20 transition-colors font-mono"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={isValidating || !apiKey.trim()}
              onClick={handleValidate}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#141926] hover:bg-[#1c2438] text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all"
            >
              {isValidating ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              <span>Test &amp; Validate</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              Save &amp; Activate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
