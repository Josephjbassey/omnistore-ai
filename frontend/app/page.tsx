"use client";

import React, { useState, useEffect } from "react";
import { ModeToggleHeader, ActiveTab } from "@/components/ModeToggleHeader";
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
  getHealth,
  generateStorefrontCode,
  scanStoreJson,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Bot, Sparkles, Store, Smartphone, PhoneCall, Terminal, X } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("demo");
  const [activePreset, setActivePreset] = useState<StallPreset>(STALL_PRESETS[0]);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);

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

  return (
    <div className="flex flex-col min-h-screen bg-[#08090a] text-[#f5f5f0] selection:bg-[#c1793f] selection:text-white">
      {/* Sole Primary Navigation Bar */}
      <ModeToggleHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        backendConnected={backendConnected}
        inventoryCount={inventoryCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* HERO SECTION */}
        <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden bg-[#0f1419] border border-[#cab695]/20 shadow-xl">
          {/* Subtle warm ambient glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#c1793f]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-2.5 relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#161d26] border border-[#c1793f]/30 text-[#cab695] text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c1793f] animate-pulse" />
              <span>Instant Market Stall Digitization &amp; WhatsApp Checkout</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              Turn your physical stall into an online WhatsApp store in seconds.
            </h1>
            <p className="text-xs sm:text-sm text-[#cab695] leading-relaxed max-w-2xl font-normal">
              Designed for market stall vendors and neighborhood retailers. Simply snap a photo of
              your stall shelf: our AI detects your products, sets fair market prices in your local
              currency ({merchantContext.currency}), and creates a mobile store ready to receive
              customer orders on WhatsApp.
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
                      : "bg-[#161d26] text-zinc-300 border-white/10 hover:border-[#cab695]/30 hover:bg-[#1e2933]"
                  }`}
                >
                  <span>{preset.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TAB 1: MAIN INTERACTIVE STUDIO */}
        {activeTab === "demo" && (
          <div className="space-y-4">
            {/* Commerce Workflow Rail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#10141d] border border-white/[0.08] flex items-center space-x-3.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-[#c1793f]/15 border border-[#c1793f]/30 flex items-center justify-center text-[#c1793f] font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>1. Snap Stall Photo</span>
                    <span className="text-[10px] font-medium text-[#cab695]">Step 1</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Snap or upload a picture of your shelf
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#10141d] border border-white/[0.08] flex items-center space-x-3.5 shadow-sm md:col-span-2">
                <div className="w-8 h-8 rounded-xl bg-[#cab695]/15 border border-[#cab695]/30 flex items-center justify-center text-[#cab695] font-bold text-xs">
                  2
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>2. Auto-Catalog &amp; Price</span>
                    <span className="text-[10px] font-medium text-[#cab695]">Step 2</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Items detected with prices in {merchantContext.currency}
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
                  inventoryThumbnails={inventoryThumbnails}
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
                <p className="text-xs text-[#cab695] mt-0.5">
                  This is your live mobile storefront. Add products to the cart and tap "Order on
                  WhatsApp" to test customer ordering.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("demo")}
                className="px-3.5 py-1.5 bg-[#161d26] hover:bg-[#1e2933] text-zinc-200 border border-white/10 rounded-xl text-xs font-semibold self-start sm:self-auto transition-colors active:scale-[0.98]"
              >
                ← Back to Stall Studio
              </button>
            </div>

            <StorefrontPreview storeSchema={storeSchema} codeResponse={codeResponse} />
          </div>
        )}

        {/* Floating Tactical Assistant */}
        <div className="fixed bottom-6 right-6 z-40">
          {!chatOpen ? (
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#161d26] hover:bg-[#1e2933] text-white rounded-2xl shadow-2xl border border-[#cab695]/30 active:translate-y-0.5 transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.6)] group"
            >
              <div className="relative">
                <Bot className="w-4 h-4 text-[#c1793f] transition-transform group-hover:scale-110" />
                <span className="w-2 h-2 rounded-full bg-[#25D366] absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-xs font-bold">Ask AI Advisor</span>
            </button>
          ) : (
            <div className="w-[390px] sm:w-[460px] h-[580px] bg-[#08090a] rounded-3xl border border-white/20 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl ring-1 ring-white/10 animate-fadeIn">
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
                <ChatInterface />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
