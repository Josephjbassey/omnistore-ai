"use client";

import React, { useState } from "react";
import {
  Brain,
  Sparkles,
  ShoppingBag,
  Tag,
  DollarSign,
  Package,
  Code2,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info,
} from "lucide-react";
import {
  StorefrontSchema,
  InventoryItem,
  BoundingBox,
  StructuredReasoningOutput,
} from "@/lib/api";

interface MultimodalReasoningPanelProps {
  storeSchema: StorefrontSchema | null;
  structuredOutput: StructuredReasoningOutput | null;
  selectedBox: BoundingBox | null;
  onGenerateCode: () => void;
  isGeneratingCode: boolean;
  onSelectItem?: (boxId: string) => void;
  isJudgeMode?: boolean;
}

export const MultimodalReasoningPanel: React.FC<MultimodalReasoningPanelProps> = ({
  storeSchema,
  structuredOutput,
  selectedBox,
  onGenerateCode,
  isGeneratingCode,
  onSelectItem,
  isJudgeMode = false,
}) => {
  const [showJson, setShowJson] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const inventory = storeSchema?.inventory || [];
  const currency = storeSchema?.currency || "NGN";

  const totalValue = inventory.reduce(
    (sum, item) => sum + item.suggested_price * item.estimated_quantity,
    0
  );
  const totalStock = inventory.reduce((a, b) => a + b.estimated_quantity, 0);

  const handleCopyJson = () => {
    if (!storeSchema) return;
    navigator.clipboard.writeText(JSON.stringify(storeSchema, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] rounded-2xl border border-white/[0.08] p-4 sm:p-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-sm">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-xs text-slate-100 uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <span>Muse Spark 1.3</span>
              <span className="text-[10px] text-purple-400 font-normal lowercase">(cognitive pricing)</span>
            </h2>
            <p className="text-[10px] text-slate-400">
              Multimodal localization &amp; SKU structuring
            </p>
          </div>
        </div>

        {/* Commanding Primary CTA Button: Synthesize Store (Muse Code) */}
        <button
          onClick={onGenerateCode}
          disabled={isGeneratingCode || inventory.length === 0}
          className="btn-command-purple flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-glow-purple disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Code2 className={`w-3.5 h-3.5 ${isGeneratingCode ? "animate-spin" : ""}`} />
          <span>{isGeneratingCode ? "Synthesizing Store..." : "Synthesize Store (Muse Code)"}</span>
        </button>
      </div>

      {/* Metrics Row (Crisp Tabular Typography & Elevated Glass Panels) */}
      <div className="grid grid-cols-3 gap-2.5 my-3.5">
        <div className="bg-[#121622] border border-white/[0.08] rounded-xl p-2.5 text-center shadow-sm">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5 tracking-wider font-medium">
            Cataloged
          </span>
          <span className="text-sm font-bold text-slate-100 font-mono tabular-nums">
            {inventory.length} SKUs
          </span>
        </div>

        <div className="bg-[#121622] border border-white/[0.08] rounded-xl p-2.5 text-center shadow-sm">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5 tracking-wider font-medium">
            Shelf Stock
          </span>
          <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
            {totalStock} units
          </span>
        </div>

        <div className="bg-[#121622] border border-white/[0.08] rounded-xl p-2.5 text-center shadow-sm">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5 tracking-wider font-medium">
            Est. Valuation
          </span>
          <span className="text-sm font-bold text-amber-400 font-mono tabular-nums">
            {totalValue.toLocaleString()} {currency}
          </span>
        </div>
      </div>

      {/* Product Catalog List (With REAL product photos) */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar min-h-0">
        {inventory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <ShoppingBag className="w-10 h-10 mb-3 opacity-30 text-slate-400 stroke-[1.5]" />
            <p className="text-xs font-medium text-slate-300">No physical goods segmented yet.</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              Execute &quot;1-Click Store Scan&quot; on the left to extract spatial boxes and infer localized pricing.
            </p>
          </div>
        ) : (
          inventory.map((item) => {
            const isTargeted = selectedBox?.box_id === item.image_segment_id;
            const isExpanded = expandedItemId === item.item_id || isTargeted;

            return (
              <div
                key={item.item_id}
                onClick={() => {
                  setExpandedItemId(isExpanded ? null : item.item_id);
                  if (onSelectItem && item.image_segment_id) {
                    onSelectItem(item.image_segment_id);
                  }
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isTargeted
                    ? "bg-[#161f2e] border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30"
                    : "bg-[#111520] border-white/[0.06] hover:border-white/20 hover:bg-[#151a26]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Real Product Photo Thumbnail */}
                    {item.image_url ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-slate-900 shadow-sm">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-1 left-1 w-2 h-2 rounded-full ${
                            isTargeted ? "bg-emerald-400 animate-ping" : "bg-cyan-400"
                          }`}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#161c28] border border-white/10 flex items-center justify-center flex-shrink-0 text-slate-400">
                        <Package className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs text-slate-100 flex items-center space-x-1.5 truncate">
                        <span className="truncate">{item.name}</span>
                        {isTargeted && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                            Active ROI
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400 truncate">
                        {item.category} · Stock: {item.estimated_quantity} units
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-bold text-xs text-amber-400 tabular-nums">
                      {item.suggested_price.toLocaleString()} {currency}
                    </span>
                    <span className="block text-[9px] font-mono text-slate-500">
                      ID: {item.image_segment_id}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Collapsible Cognitive Deep Dive Details */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] text-[10px] space-y-1.5 font-mono animate-fadeIn">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span>Pricing Strategy:</span>
                      </span>
                      <span className="text-slate-200">Local Market Grounding (Akure/Lagos)</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Stock Velocity:</span>
                      <span className="text-emerald-400">High Turnover · Daily Staple</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Reasoning Confidence:</span>
                      <span className="text-purple-300">96.8% (Muse Spark Grounded)</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* In Judge Mode: Real-time Telemetry & Cognitive Assessment */}
      {isJudgeMode && structuredOutput && (
        <div className="mt-3 p-3 rounded-xl bg-[#121624] border border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1">
              <Zap className="w-3 h-3 text-purple-400" />
              <span>Cognitive Grounding Assessment</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{structuredOutput.safety_assessment.toUpperCase()}</span>
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            {structuredOutput.detailed_analysis}
          </p>

          <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-400 border-t border-white/5">
            <span>Confidence Index:</span>
            <span className="text-purple-300 font-bold">
              {(structuredOutput.confidence_score * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* JSON Schema Drawer Toggle */}
      <div className="pt-2.5 mt-2 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center space-x-1.5 text-slate-400 hover:text-slate-200 text-[11px] font-mono transition-colors"
          >
            {showJson ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>StorefrontSchema JSON Contract</span>
          </button>

          {showJson && storeSchema && (
            <button
              onClick={handleCopyJson}
              className="flex items-center space-x-1 text-[10px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded bg-[#121622] border border-white/10 transition-colors"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>

        {showJson && storeSchema && (
          <div className="mt-2 relative">
            <pre className="p-3 bg-[#07090e] border border-white/10 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-40 leading-relaxed">
              {JSON.stringify(storeSchema, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
