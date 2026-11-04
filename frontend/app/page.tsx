"use client";

import React, { useState, useEffect } from "react";
import { ModeToggleHeader, ViewMode, ActiveTab } from "@/components/ModeToggleHeader";
import { SegmentCanvas } from "@/components/SegmentCanvas";
import { MultimodalReasoningPanel } from "@/components/MultimodalReasoningPanel";
import { StorefrontPreview } from "@/components/StorefrontPreview";
import { TaskQueueWidget } from "@/components/TaskQueueWidget";
import { ChatInterface } from "@/components/ChatInterface";
import { STALL_PRESETS, StallPreset } from "@/lib/presets";
import {
  BoundingBox,
  InventoryItem,
  MerchantContext,
  StorefrontSchema,
  StructuredReasoningOutput,
  CodeGenerateResponse,
  PipelineResponse,
  SquadRoleInfo,
  getHealth,
  getSquadRoles,
  generateStorefrontCode,
  scanStoreJson,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  Bot,
  Sparkles,
  Store,
  Layers,
  Code2,
  X,
  ChevronRight,
  Camera,
  Tag,
  Smartphone,
  PhoneCall,
  Terminal,
  Activity,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Zap,
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, isLoading, logout, login, register } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("demo");
  const [viewMode, setViewMode] = useState<ViewMode>("merchant");
  const [activePreset, setActivePreset] = useState<StallPreset>(STALL_PRESETS[0]);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [activeRole, setActiveRole] = useState<string>("commander");
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);

  // Sync viewMode from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("omnistore_view_mode") as ViewMode | null;
      if (saved === "merchant" || saved === "judge") {
        setViewMode(saved);
      }
    } catch {}
  }, []);

  // Merchant context
  const [merchantContext, setMerchantContext] = useState<MerchantContext>({
    store_name: STALL_PRESETS[0].name,
    currency: STALL_PRESETS[0].currency,
    location: STALL_PRESETS[0].location,
    whatsapp_number: STALL_PRESETS[0].whatsapp_number,
  });

  // State populated through 3-model pipeline
  const [selectedBox, setSelectedBox] = useState<BoundingBox | null>(STALL_PRESETS[0].boxes[0]);
  const [storeSchema, setStoreSchema] = useState<StorefrontSchema | null>(STALL_PRESETS[0].schema);
  const [structuredOutput, setStructuredOutput] = useState<StructuredReasoningOutput | null>({
    summary: `Digitized ${STALL_PRESETS[0].schema.inventory.length} items for ${STALL_PRESETS[0].name}.`,
    store_meta: {
      store_name: STALL_PRESETS[0].name,
      currency: STALL_PRESETS[0].currency,
      location: STALL_PRESETS[0].location,
    },
    inventory: STALL_PRESETS[0].schema.inventory,
    entities_detected: STALL_PRESETS[0].boxes.map((b) => ({
      entity: b.label,
      box_id: b.box_id,
      relevance: "high",
      properties: { confidence: b.confidence },
    })),
    detailed_analysis: `SAM 3.1 segmented ${STALL_PRESETS[0].boxes.length} shelf regions. Muse Spark 1.3 priced items in ${STALL_PRESETS[0].currency}. Muse Code generated mobile storefront with WhatsApp checkout.`,
    recommended_actions: [
      `Share instant mobile storefront link with customers on WhatsApp (${STALL_PRESETS[0].whatsapp_number}).`,
      "Print QR code poster for physical stall display.",
      "Sync stock counts with daily reorder thresholds.",
    ],
    confidence_score: 0.98,
    safety_assessment: "safe",
  });
  const [codeResponse, setCodeResponse] = useState<CodeGenerateResponse | null>(null);

  // Switch stall preset
  const handleSelectPreset = (preset: StallPreset) => {
    setActivePreset(preset);
    setMerchantContext({
      store_name: preset.name,
      currency: preset.currency,
      location: preset.location,
      whatsapp_number: preset.whatsapp_number,
    });
    setStoreSchema(preset.schema);
    setSelectedBox(preset.boxes[0]);
    setStructuredOutput({
      summary: `Digitized ${preset.schema.inventory.length} items for ${preset.name}.`,
      store_meta: {
        store_name: preset.name,
        currency: preset.currency,
        location: preset.location,
      },
      inventory: preset.schema.inventory,
      entities_detected: preset.boxes.map((b) => ({
        entity: b.label,
        box_id: b.box_id,
        relevance: "high",
        properties: { confidence: b.confidence },
      })),
      detailed_analysis: `SAM 3.1 identified ${preset.boxes.length} products. Muse Spark priced inventory in ${preset.currency}. Muse Code prepared mobile storefront.`,
      recommended_actions: [
        `Publish mobile storefront to WhatsApp (${preset.whatsapp_number}).`,
        "Print out localized QR code for stall placement.",
      ],
      confidence_score: 0.98,
      safety_assessment: "safe",
    });
  };

  // Agent squad roles
  const [roles, setRoles] = useState<SquadRoleInfo[]>([
    {
      role: "commander",
      name: "OmniStore Commander",
      model: "muse-spark-1.3",
      description: "Executive coordinator & micro-business digitization advisor.",
      capabilities: ["Pipeline Orchestration", "Merchant Advisory", "Dialogue Flow"],
    },
    {
      role: "planner",
      name: "Inventory Planner",
      model: "muse-spark-1.3",
      description: "Shelf layout optimization, stock analysis, and demand forecasting.",
      capabilities: ["Shelf Density", "Stock Velocity", "Pricing Matrix"],
    },
    {
      role: "coder",
      name: "Muse Code Engineer",
      model: "muse-code",
      description: "Agentic web code synthesis, PWA builder, and WhatsApp checkout integration.",
      capabilities: ["Next.js 14", "Tailwind CSS", "WhatsApp API", "Prisma/SQLite"],
    },
    {
      role: "desktop",
      name: "SAM 3.1 Spatial Eye",
      model: "sam-3.1",
      description: "Zero-shot visual perception, object masking, and coordinate localization.",
      capabilities: ["Physical Segmentation", "Bounding Boxes", "Shelf Frame OCR"],
    },
  ]);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const health = await getHealth();
        setBackendConnected(health.status === "healthy" || health.status === "ok");
      } catch {
        setBackendConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 12000);
    return () => clearInterval(interval);
  }, []);

  const handlePipelineComplete = (result: PipelineResponse) => {
    // Retain real product image URLs from active presets
    const augmentedInventory = (result.store_schema.inventory || []).map((item) => {
      if (!item.image_url) {
        const presetMatch = activePreset.schema.inventory.find(
          (pi) => pi.image_segment_id === item.image_segment_id || pi.name === item.name
        );
        if (presetMatch?.image_url) {
          return { ...item, image_url: presetMatch.image_url };
        }
      }
      return item;
    });

    const augmentedSchema: StorefrontSchema = {
      ...result.store_schema,
      inventory: augmentedInventory,
    };

    setStoreSchema(augmentedSchema);
    if (result.code_synthesis) {
      setCodeResponse(result.code_synthesis);
    }
    if (result.bounding_boxes && result.bounding_boxes.length > 0) {
      setSelectedBox(result.bounding_boxes[0]);
    }

    // Persist new scan to cache
    const slug = (augmentedSchema.store_title || augmentedSchema.store_name || "store")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    try {
      localStorage.setItem(`omnistore_store_${slug}`, JSON.stringify(augmentedSchema));
      localStorage.setItem("omnistore_active_store", JSON.stringify(augmentedSchema));
      fetch(`/api/v1/store/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: augmentedSchema }),
      }).catch(() => {});
    } catch {}
  };

  const handleUpdateInventoryItem = (itemId: string, updates: Partial<InventoryItem>) => {
    if (!storeSchema) return;
    const updatedInventory = (storeSchema.inventory || []).map((item) => {
      if (item.item_id === itemId) {
        return { ...item, ...updates };
      }
      return item;
    });
    const updatedSchema: StorefrontSchema = {
      ...storeSchema,
      inventory: updatedInventory,
    };
    setStoreSchema(updatedSchema);
    if (structuredOutput) {
      setStructuredOutput({
        ...structuredOutput,
        inventory: updatedInventory,
      });
    }

    // Persist across devices and sessions
    const slug = (updatedSchema.store_title || updatedSchema.store_name || "store")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    try {
      localStorage.setItem(`omnistore_store_${slug}`, JSON.stringify(updatedSchema));
      localStorage.setItem("omnistore_active_store", JSON.stringify(updatedSchema));
      fetch(`/api/v1/store/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: updatedSchema }),
      }).catch(() => {});
    } catch {}
  };

  const inventoryThumbnails = React.useMemo(() => {
    const map: Record<string, string> = {};
    (storeSchema?.inventory || []).forEach((item) => {
      if (item.image_segment_id && item.image_url) {
        map[item.image_segment_id] = item.image_url;
      }
    });
    return map;
  }, [storeSchema]);

  const handleGenerateCode = async () => {
    if (!storeSchema) return;
    setIsGeneratingCode(true);
    try {
      const res = await generateStorefrontCode({
        store_schema: storeSchema,
        target_framework: "nextjs14_tailwind",
      });
      setCodeResponse(res);
      const slug = (storeSchema.store_title || storeSchema.store_name || "store")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      try {
        localStorage.setItem(`omnistore_store_${slug}`, JSON.stringify(storeSchema));
        localStorage.setItem("omnistore_active_store", JSON.stringify(storeSchema));
        fetch(`/api/v1/store/${slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schema: storeSchema }),
        }).catch(() => {});
      } catch {}
      setActiveTab("storefront");
    } catch (err) {
      console.error("Code synthesis error:", err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const inventoryCount = storeSchema?.inventory?.length || 0;
  const segmentsCount = selectedBox ? (storeSchema?.inventory?.length || 6) : 6;

  return (
    <div className="flex flex-col min-h-screen bg-[#08090a] text-zinc-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Floating Glassmorphic Header & Dual Mode Switcher */}
      <ModeToggleHeader
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        backendConnected={backendConnected}
        inventoryCount={inventoryCount}
        segmentsCount={segmentsCount}
        processingTimeMs={380}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Auth Bar */}
        {isLoading ? null : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e1118]/80 border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 mb-4 backdrop-blur-md shadow-sm">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-[#141722] border border-white/10 rounded-xl px-2.5 py-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-semibold text-zinc-200">{user.full_name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{user.role}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => router.push("/")}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm transition-all active:scale-[0.98]"
                  >
                    Publish Store
                  </button>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#141722] hover:bg-[#1c2130] text-zinc-300 border border-white/10 transition-all active:scale-[0.98]"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between w-full text-xs font-medium text-zinc-400">
                <span className="text-zinc-400 font-mono text-[11px]">OmniStore Cloud Session · Guest Mode</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => router.push("/auth/login")}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm transition-all active:scale-[0.98]"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => router.push("/auth/register")}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#141722] hover:bg-white/5 text-emerald-400 border border-emerald-500/30 transition-all active:scale-[0.98]"
                  >
                    Create account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HERO SECTION: Tailored based on View Mode */}
        {viewMode === "merchant" ? (
          /* Merchant / Store Owner Experience Header */
          <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden bg-gradient-to-b from-[#0f121a] to-[#0a0c12] border border-white/[0.08] shadow-2xl">
            {/* Subtle radial ambient glow */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl space-y-2.5 relative z-10">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>3-Step Merchant Flow: 1. Photo → 2. AI Pricing → 3. WhatsApp Store</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Turn any market stall or kiosk into an online store in seconds.
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl font-normal">
                Built for small market stall merchants and informal traders who operate without barcodes or desktop POS terminals. Our intelligent camera auto-catalogs products from your photo, sets fair market pricing in local currency (NGN ₦), and launches a mobile store with direct WhatsApp checkout.
              </p>
            </div>

            {/* Quick 1-Click Preset Switcher */}
            <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  Sample Market Stalls:
                </span>
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                  (select to test zero-shot detection)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {STALL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 font-medium active:scale-[0.98] ${
                      activePreset.id === preset.id
                        ? "bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : "bg-[#11141c] text-zinc-300 border-white/10 hover:border-white/25 hover:bg-[#181d28]"
                    }`}
                  >
                    <span>{preset.badge}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Judge / Meta AI Mode Telemetry Header */
          <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden border border-purple-500/25 shadow-2xl bg-gradient-to-r from-purple-950/20 via-[#0a0c12] to-emerald-950/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 text-[11px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span>Meta Global AI Hackathon · Telemetry &amp; Reasoning Inspector</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
                  <span>Meta AI Tri-Model Autonomous Commerce Pipeline</span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
                  Decoupled architecture orchestrating <strong className="text-cyan-300 font-mono">SAM 3.1</strong> (Zero-shot Spatial Perception), <strong className="text-purple-300 font-mono">Muse Spark 1.3</strong> (Multimodal Emerging Market Reasoning), and <strong className="text-emerald-300 font-mono">Muse Code</strong> (Agentic Next.js 14 App Router Synthesis).
                </p>
              </div>

              {/* Technical Model Chips */}
              <div className="grid grid-cols-3 gap-2.5 min-w-[280px]">
                <div className="bg-[#10141f] border border-cyan-500/20 rounded-xl p-2.5 text-center shadow-sm">
                  <span className="text-[9px] uppercase font-mono text-cyan-400 block font-bold">1. Perception</span>
                  <span className="text-xs font-bold text-white font-mono">SAM 3.1</span>
                  <span className="block text-[9px] text-zinc-400 font-mono">Spatial Masks</span>
                </div>
                <div className="bg-[#10141f] border border-purple-500/20 rounded-xl p-2.5 text-center shadow-sm">
                  <span className="text-[9px] uppercase font-mono text-purple-400 block font-bold">2. Reasoning</span>
                  <span className="text-xs font-bold text-white font-mono">Muse Spark</span>
                  <span className="block text-[9px] text-zinc-400 font-mono">NGN Pricing</span>
                </div>
                <div className="bg-[#10141f] border border-emerald-500/20 rounded-xl p-2.5 text-center shadow-sm">
                  <span className="text-[9px] uppercase font-mono text-emerald-400 block font-bold">3. Synthesis</span>
                  <span className="text-xs font-bold text-white font-mono">Muse Code</span>
                  <span className="block text-[9px] text-zinc-400 font-mono">PWA Web App</span>
                </div>
              </div>
            </div>

            {/* Preset Selector in Judge Mode */}
            <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] font-mono text-zinc-400">
                Evaluation Test Stalls:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {STALL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-xs px-3 py-1 rounded-lg border font-mono transition-all active:scale-[0.98] ${
                      activePreset.id === preset.id
                        ? "bg-purple-600 text-white font-bold border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                        : "bg-[#11141c] text-zinc-400 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {preset.name} ({preset.boxes.length} SKUs)
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: MAIN INTERACTIVE STUDIO */}
        {activeTab === "demo" && (
          <div className="space-y-4">
            {/* 3 Step Process Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#08090a] border border-white/[0.08] flex items-center space-x-3.5 shadow-sm backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs shadow-inner">
                  1
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>{viewMode === "judge" ? "Physical Stall Photo" : "1. Snap Stall Photo"}</span>
                    {viewMode === "judge" ? (
                      <span className="text-[10px] font-mono text-cyan-400">(SAM 3.1)</span>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-400">Step 1</span>
                    )}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {viewMode === "judge" ? "Isolates physical goods & stock contours" : "Take or upload a picture of your stall shelf"}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#08090a] border border-white/[0.08] flex items-center space-x-3.5 shadow-sm backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs shadow-inner">
                  2
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>{viewMode === "judge" ? "Cognitive Local Pricing" : "2. AI Catalogs Items"}</span>
                    {viewMode === "judge" ? (
                      <span className="text-[10px] font-mono text-amber-400">(Muse Spark)</span>
                    ) : (
                      <span className="text-[10px] font-mono text-amber-400">Step 2</span>
                    )}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {viewMode === "judge"
                      ? `Calculates fair market rates in ${merchantContext.currency}`
                      : `Automatic product catalog & pricing in ${merchantContext.currency}`}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#08090a] border border-white/[0.08] flex items-center space-x-3.5 shadow-sm backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shadow-inner">
                  3
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>{viewMode === "judge" ? "1-Click WhatsApp Store" : "3. Launch WhatsApp Store"}</span>
                    {viewMode === "judge" ? (
                      <span className="text-[10px] font-mono text-emerald-400">(Muse Code)</span>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-400">Step 3</span>
                    )}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {viewMode === "judge"
                      ? "Instant web app + WhatsApp checkout"
                      : "Share instant order link with WhatsApp customers"}
                  </p>
                </div>
              </div>
            </div>

            {/* Split Screen Studio: Step 1 (Left) & Step 2 (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: SAM 3.1 Visual Canvas (Step 1) */}
              <div className="lg:col-span-7">
                <SegmentCanvas
                  merchantContext={merchantContext}
                  onUpdateMerchantContext={setMerchantContext}
                  onPipelineComplete={handlePipelineComplete}
                  onSelectBox={setSelectedBox}
                  selectedBoxId={selectedBox?.box_id}
                  stallImageUrl={activePreset.image_url}
                  presetBoxes={activePreset.boxes}
                  inventoryThumbnails={inventoryThumbnails}
                  viewMode={viewMode}
                />
              </div>

              {/* Right Column: Muse Spark Cognitive Reasoning (Step 2) */}
              <div className="lg:col-span-5 h-[640px]">
                <MultimodalReasoningPanel
                  storeSchema={storeSchema}
                  structuredOutput={structuredOutput}
                  selectedBox={selectedBox}
                  onGenerateCode={handleGenerateCode}
                  isGeneratingCode={isGeneratingCode}
                  onSelectItem={(boxId) => {
                    const match = activePreset.boxes.find((b) => b.box_id === boxId);
                    if (match) setSelectedBox(match);
                  }}
                  isJudgeMode={viewMode === "judge"}
                  onUpdateInventoryItem={handleUpdateInventoryItem}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STOREFRONT & PHONE SIMULATOR (Step 3) */}
        {activeTab === "storefront" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#08090a] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Live Customer Experience (Smartphone Simulator)</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {viewMode === "judge"
                    ? 'This is the exact mobile storefront synthesized by Muse Code. Add products to the cart and tap "Order on WhatsApp" to test the order route.'
                    : 'This is your live mobile storefront. Add products to the cart and tap "Order on WhatsApp" to test customer ordering.'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("demo")}
                className="px-3.5 py-1.5 bg-[#141722] hover:bg-[#1a202c] text-zinc-200 border border-white/10 rounded-xl text-xs font-semibold self-start sm:self-auto transition-colors active:scale-[0.98]"
              >
                ← Back to Visual Studio
              </button>
            </div>

            <StorefrontPreview
              storeSchema={storeSchema}
              codeResponse={codeResponse}
              isJudgeMode={viewMode === "judge"}
            />
          </div>
        )}

        {/* TAB 3: UNDER THE HOOD / META AI ARCHITECTURE (For Judges & Engineers) */}
        {activeTab === "architecture" && (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-[#08090a] border border-white/[0.08] space-y-4 shadow-2xl backdrop-blur-md">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Meta AI 3-Model Pipeline Architecture</span>
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
                OmniStore AI solves the informal retail bottleneck by replacing tedious manual inventory data entry with an autonomous 3-stage agent loop:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#0e1118] border border-cyan-500/20 space-y-2 shadow-sm">
                  <span className="text-[10px] font-mono uppercase text-cyan-400 block font-bold">
                    1. SAM 3.1 (Eyes)
                  </span>
                  <h3 className="text-xs font-bold text-white">Visual Perception &amp; Segmentation</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Zero-shot detection of physical produce and goods on market shelves. Outputs normalized bounding coordinates [ymin, xmin, ymax, xmax], polygon contours, and visual crops.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0e1118] border border-amber-500/20 space-y-2 shadow-sm">
                  <span className="text-[10px] font-mono uppercase text-amber-400 block font-bold">
                    2. Muse Spark 1.3 (Brain)
                  </span>
                  <h3 className="text-xs font-bold text-white">Cognitive Reasoning &amp; Pricing</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Multimodal grounding in emerging market commerce. Infers product names, counts stock from visual masks, assigns fair market rates in local currency, and formats structured StorefrontSchema JSON.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0e1118] border border-emerald-500/20 space-y-2 shadow-sm">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 block font-bold">
                    3. Muse Code (Hands)
                  </span>
                  <h3 className="text-xs font-bold text-white">Agentic Web Synthesis</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Programmatically writes mobile-first Next.js 14 App Router storefront code (app/page.tsx), a WhatsApp checkout API handler (checkout/route.ts), and Prisma database models.
                  </p>
                </div>
              </div>
            </div>

            {/* Task Queue Widget for long-running batch jobs */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
                Async Background Inference Queue &amp; Webhooks
              </h3>
              <TaskQueueWidget />
            </div>
          </div>
        )}
      </main>

      {/* Floating Tactical Assistant */}
      <div className="fixed bottom-6 right-6 z-40">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#0f121a] hover:bg-[#161a24] text-white rounded-2xl shadow-2xl border border-white/20 active:translate-y-0.5 transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.6)] group"
          >
            <div className="relative">
              <Bot className="w-4 h-4 text-emerald-400 transition-transform group-hover:scale-110" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-xs font-bold">Ask AI Advisor</span>
          </button>
        ) : (
          <div className="w-[390px] sm:w-[460px] h-[580px] bg-[#08090a] rounded-3xl border border-white/20 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl ring-1 ring-white/10 animate-fadeIn">
            <div className="p-3.5 bg-[#0e1118] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white">OmniStore AI Assistant</h3>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 p-2 overflow-hidden">
              <ChatInterface
                activeRole={activeRole}
                onSelectRole={setActiveRole}
                roles={roles}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
