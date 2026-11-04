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
    <div className="flex flex-col min-h-screen bg-[#090b10] text-[#f7f8f9] selection:bg-[#c1793f] selection:text-white">
      {/* Floating Single Header & Dual Mode Switcher */}
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
        {/* Merchant Account & Store Status Bar */}
        {isLoading ? null : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#10141d] border border-white/[0.08] rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-sm">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-[#161c28] border border-[#cab695]/20 rounded-xl px-3 py-1">
                    <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                    <span className="text-xs font-semibold text-[#f7f8f9]">{user.full_name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#cab695] uppercase tracking-wider font-semibold">
                    {merchantContext.store_name} · {merchantContext.location}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab("storefront")}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#c1793f] hover:bg-[#d68749] text-white shadow-sm transition-all active:scale-[0.98]"
                  >
                    View Live Storefront
                  </button>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#161c28] hover:bg-[#1f2738] text-zinc-300 border border-white/10 transition-all active:scale-[0.98]"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 text-xs font-medium text-zinc-300">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#c1793f]" />
                  <span className="font-semibold text-[#f7f8f9]">Merchant Studio</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    Active Stall: {merchantContext.store_name} ({merchantContext.location})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => router.push("/auth/login")}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#161c28] hover:bg-[#1f2738] text-zinc-200 border border-white/10 transition-all active:scale-[0.98]"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => router.push("/auth/register")}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#c1793f] hover:bg-[#d68749] text-white shadow-sm transition-all active:scale-[0.98]"
                  >
                    Create Merchant Account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HERO SECTION: Tailored based on View Mode */}
        {viewMode === "merchant" ? (
          /* Merchant / Store Owner Experience Header */
          <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden bg-[#10141d] border border-[#cab695]/20 shadow-xl">
            {/* Subtle warm ambient glow */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#c1793f]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl space-y-2.5 relative z-10">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1c1613] border border-[#c1793f]/30 text-[#e4bea1] text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c1793f] animate-pulse" />
                <span>Instant Market Stall Digitization &amp; WhatsApp Checkout</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Turn your physical stall into an online WhatsApp store in seconds.
              </h1>
              <p className="text-xs sm:text-sm text-[#cdd4dc] leading-relaxed max-w-2xl font-normal">
                Designed for market stall vendors and neighborhood retailers. Simply snap a photo of your stall shelf: our AI detects your products, sets fair market prices in your local currency ({merchantContext.currency}), and creates a mobile store ready to receive customer orders on WhatsApp.
              </p>
            </div>

            {/* Quick 1-Click Preset Switcher */}
            <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-[#cab695] uppercase tracking-wider font-mono">
                  Sample Market Stalls:
                </span>
                <span className="text-[10px] text-zinc-500 hidden sm:inline">
                  (select a demo stall or upload your own photo below)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {STALL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 font-medium active:scale-[0.98] ${
                      activePreset.id === preset.id
                        ? "bg-[#c1793f] text-white font-bold border-[#c1793f] shadow-[0_2px_12px_rgba(193,121,63,0.35)]"
                        : "bg-[#161c28] text-zinc-300 border-white/10 hover:border-[#cab695]/30 hover:bg-[#1f2738]"
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
          <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden border border-[#526569]/40 shadow-xl bg-gradient-to-r from-[#121820] via-[#10141d] to-[#1a1418]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#161c28] border border-[#526569]/50 text-[#cab695] text-[11px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#526569] animate-pulse" />
                  <span>Meta Global AI Hackathon · Tri-Model Telemetry &amp; Reasoning</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
                  <span>Meta AI Autonomous Commerce Pipeline</span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
                  Decoupled multi-agent architecture orchestrating <strong className="text-[#96a8b4] font-mono">SAM 3.1</strong> (Zero-shot Spatial Perception), <strong className="text-[#cab695] font-mono">Muse Spark 1.3</strong> (Multimodal Emerging Market Grounding), and <strong className="text-[#25D366] font-mono">Muse Code</strong> (Agentic Next.js 14 Web Synthesis).
                </p>
              </div>

              {/* Technical Model Chips */}
              <div className="grid grid-cols-3 gap-2.5 min-w-[280px]">
                <div className="bg-[#161c28] border border-[#526569]/30 rounded-xl p-2.5 text-center shadow-sm">
                  <span className="text-[9px] uppercase font-mono text-[#96a8b4] block font-bold">1. Perception</span>
                  <span className="text-xs font-bold text-white font-mono">SAM 3.1</span>
                  <span className="block text-[9px] text-zinc-400 font-mono">Spatial Masks</span>
                </div>
                <div className="bg-[#161c28] border border-[#c1793f]/30 rounded-xl p-2.5 text-center shadow-sm">
                  <span className="text-[9px] uppercase font-mono text-[#cab695] block font-bold">2. Reasoning</span>
                  <span className="text-xs font-bold text-white font-mono">Muse Spark</span>
                  <span className="block text-[9px] text-zinc-400 font-mono">NGN Pricing</span>
                </div>
                <div className="bg-[#161c28] border border-[#25D366]/30 rounded-xl p-2.5 text-center shadow-sm">
                  <span className="text-[9px] uppercase font-mono text-[#25D366] block font-bold">3. Synthesis</span>
                  <span className="text-xs font-bold text-white font-mono">Muse Code</span>
                  <span className="block text-[9px] text-zinc-400 font-mono">PWA Web App</span>
                </div>
              </div>
            </div>

            {/* Preset Selector in Judge Mode */}
            <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] font-mono text-[#cab695]">
                Evaluation Test Stalls:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {STALL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-xs px-3 py-1 rounded-lg border font-mono transition-all active:scale-[0.98] ${
                      activePreset.id === preset.id
                        ? "bg-[#6a3f49] text-white font-bold border-[#c1793f] shadow-[0_2px_10px_rgba(106,63,73,0.4)]"
                        : "bg-[#161c28] text-zinc-400 border-white/10 hover:border-white/20"
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
            {/* Commerce Workflow Rail */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#10141d] border border-white/[0.08] flex items-center space-x-3.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-[#c1793f]/15 border border-[#c1793f]/30 flex items-center justify-center text-[#c1793f] font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>{viewMode === "judge" ? "Visual Perception" : "1. Snap Stall Photo"}</span>
                    {viewMode === "judge" ? (
                      <span className="text-[10px] font-mono text-[#96a8b4]">(SAM 3.1)</span>
                    ) : (
                      <span className="text-[10px] font-medium text-[#cab695]">Step 1</span>
                    )}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {viewMode === "judge" ? "Spatial bounding masks & produce segmentation" : "Snap or upload a photo of your shelf"}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#10141d] border border-white/[0.08] flex items-center space-x-3.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-[#cab695]/15 border border-[#cab695]/30 flex items-center justify-center text-[#cab695] font-bold text-xs">
                  2
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>{viewMode === "judge" ? "Local Market Reasoning" : "2. Auto-Catalog & Price"}</span>
                    {viewMode === "judge" ? (
                      <span className="text-[10px] font-mono text-[#cab695]">(Muse Spark)</span>
                    ) : (
                      <span className="text-[10px] font-medium text-[#cab695]">Step 2</span>
                    )}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {viewMode === "judge"
                      ? `Computes fair retail rates in ${merchantContext.currency}`
                      : `Items detected with prices in ${merchantContext.currency}`}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#10141d] border border-white/[0.08] flex items-center space-x-3.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] font-bold text-xs">
                  3
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>{viewMode === "judge" ? "Autonomous Storefront" : "3. Launch WhatsApp Store"}</span>
                    {viewMode === "judge" ? (
                      <span className="text-[10px] font-mono text-[#25D366]">(Muse Code)</span>
                    ) : (
                      <span className="text-[10px] font-medium text-[#25D366]">Step 3</span>
                    )}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {viewMode === "judge"
                      ? "PWA generation with WhatsApp checkout"
                      : "Share link with customers to order on WhatsApp"}
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
            <div className="p-4 rounded-2xl bg-[#10141d] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-[#c1793f]" />
                  <span>Live Customer Experience (Smartphone Simulator)</span>
                </h2>
                <p className="text-xs text-[#cdd4dc] mt-0.5">
                  {viewMode === "judge"
                    ? 'This is the exact mobile storefront synthesized by Muse Code. Add products to the cart and tap "Order on WhatsApp" to test the order route.'
                    : 'This is your live mobile storefront. Add products to the cart and tap "Order on WhatsApp" to test customer ordering.'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("demo")}
                className="px-3.5 py-1.5 bg-[#161c28] hover:bg-[#1f2738] text-zinc-200 border border-white/10 rounded-xl text-xs font-semibold self-start sm:self-auto transition-colors active:scale-[0.98]"
              >
                ← Back to Stall Studio
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
            <div className="p-5 sm:p-6 rounded-2xl bg-[#10141d] border border-[#526569]/30 space-y-4 shadow-xl backdrop-blur-md">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-[#c1793f]" />
                <span>Meta AI 3-Model Pipeline Architecture</span>
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
                OmniStore AI solves the informal retail bottleneck by replacing tedious manual inventory data entry with an autonomous 3-stage agent loop:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#161c28] border border-[#526569]/40 space-y-2 shadow-sm">
                  <span className="text-[10px] font-mono uppercase text-[#96a8b4] block font-bold">
                    1. SAM 3.1 (Eyes)
                  </span>
                  <h3 className="text-xs font-bold text-white">Visual Perception &amp; Segmentation</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Zero-shot detection of physical produce and goods on market shelves. Outputs normalized bounding coordinates [ymin, xmin, ymax, xmax], polygon contours, and visual crops.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#161c28] border border-[#c1793f]/40 space-y-2 shadow-sm">
                  <span className="text-[10px] font-mono uppercase text-[#cab695] block font-bold">
                    2. Muse Spark 1.3 (Brain)
                  </span>
                  <h3 className="text-xs font-bold text-white">Cognitive Reasoning &amp; Pricing</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Multimodal grounding in emerging market commerce. Infers product names, counts stock from visual masks, assigns fair market rates in local currency, and formats structured StorefrontSchema JSON.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#161c28] border border-[#25D366]/40 space-y-2 shadow-sm">
                  <span className="text-[10px] font-mono uppercase text-[#25D366] block font-bold">
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
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#cab695]">
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
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#161c28] hover:bg-[#1f2738] text-white rounded-2xl shadow-2xl border border-[#cab695]/30 active:translate-y-0.5 transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.6)] group"
          >
            <div className="relative">
              <Bot className="w-4 h-4 text-[#c1793f] transition-transform group-hover:scale-110" />
              <span className="w-2 h-2 rounded-full bg-[#25D366] absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-xs font-bold">Ask AI Advisor</span>
          </button>
        ) : (
          <div className="w-[390px] sm:w-[460px] h-[580px] bg-[#090b10] rounded-3xl border border-white/20 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl ring-1 ring-white/10 animate-fadeIn">
            <div className="p-3.5 bg-[#10141d] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-[#c1793f]" />
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
