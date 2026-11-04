"use client";

import React, { useState } from "react";
import {
  Code,
  Smartphone,
  ExternalLink,
  ShoppingBag,
  Check,
  Copy,
  Layers,
  Sparkles,
  PhoneCall,
  Terminal,
  Wifi,
  Battery,
  Share2,
  QrCode,
  ArrowRight,
  Rocket,
  Globe,
  X,
  Plus,
  Download,
} from "lucide-react";
import { StorefrontSchema, CodeGenerateResponse, resolveStorefrontUrl, getAppUrl } from "@/lib/api";

interface StorefrontPreviewProps {
  storeSchema: StorefrontSchema | null;
  codeResponse: CodeGenerateResponse | null;
  isJudgeMode?: boolean;
}

export const StorefrontPreview: React.FC<StorefrontPreviewProps> = ({
  storeSchema,
  codeResponse,
  isJudgeMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [selectedFile, setSelectedFile] = useState<string>("app/page.tsx");
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const inventory = storeSchema?.inventory || [];
  const currency = storeSchema?.currency || "NGN";
  const files = codeResponse?.repository_files || {};

  const storeSlug = storeSchema?.store_title
    ? storeSchema.store_title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")
    : "lagos-produce";

  // Real live working storefront URL on this application
  const realStoreUrl = resolveStorefrontUrl(codeResponse?.preview_url || `/store/${storeSlug}`);

  const promoText = `🏪 Welcome to ${storeSchema?.store_title || "our store"}!\n` +
    `Shop our newly digitized market catalog online and order directly via WhatsApp:\n` +
    `👉 ${realStoreUrl}\n\n` +
    `📍 ${storeSchema?.location || "Central Market"}\n` +
    `🛵 Fast local delivery & pay-on-delivery available!`;

  const handleShareWhatsAppBroadcast = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(promoText)}`, "_blank");
  };

  const handleCopyPromoText = () => {
    navigator.clipboard.writeText(promoText);
    setCopiedPromo(true);
    setTimeout(() => setCopiedPromo(false), 2000);
  };

  const handleDownloadCode = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify(
        {
          store_title: storeSchema?.store_title,
          currency: storeSchema?.currency,
          location: storeSchema?.location,
          whatsapp_number: storeSchema?.whatsapp_number,
          inventory: storeSchema?.inventory,
          synthesized_files: files,
        },
        null,
        2
      )
    );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${storeSlug}-storefront.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = inventory.reduce(
    (sum, item) => sum + (cart[item.item_id] || 0) * item.suggested_price,
    0
  );

  const handleWhatsAppOrder = () => {
    const lines = inventory
      .filter((p) => cart[p.item_id])
      .map(
        (p) =>
          `- ${p.name} x${cart[p.item_id]} (${(p.suggested_price * cart[p.item_id]).toLocaleString()} ${currency})`
      );
    const msg = encodeURIComponent(
      `Hello ${storeSchema?.store_title || "Merchant"}! I would like to order:\n${lines.join(
        "\n"
      )}\n\nTotal: ${totalPrice.toLocaleString()} ${currency}\n\nDelivery address: Akure Market Hub`
    );
    const phone = storeSchema?.whatsapp_number?.replace(/[^0-9]/g, "") || "2348012345678";
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const copyCode = () => {
    if (files[selectedFile]) {
      navigator.clipboard.writeText(files[selectedFile]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(realStoreUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#08090a] rounded-2xl border border-white/[0.08] p-4 sm:p-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-white/[0.08] gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            {isJudgeMode ? (
              <>
                <h2 className="font-semibold text-xs text-zinc-100 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                  <span>Muse Code</span>
                  <span className="text-[10px] text-emerald-400 font-normal lowercase">(synthesized PWA &amp; storefront)</span>
                </h2>
                <p className="text-[10px] text-zinc-400">
                  Mobile-first web app with direct WhatsApp cart integration
                </p>
              </>
            ) : (
              <>
                <h2 className="font-semibold text-xs text-zinc-100 flex items-center space-x-1.5">
                  <span>Live Mobile Storefront</span>
                </h2>
                <p className="text-[10px] text-zinc-400">
                  Ready to share with customers on WhatsApp
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tab Switcher: Only in Judge Mode */}
          {isJudgeMode && (
            <div className="flex items-center space-x-1 bg-[#0e1118] border border-white/10 p-1 rounded-xl shadow-inner">
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                  activeTab === "preview"
                    ? "bg-emerald-500 text-slate-950 shadow-sm font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Live View</span>
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                  activeTab === "code"
                    ? "bg-purple-600 text-white shadow-sm font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Generated Code ({Object.keys(files).length || 4})</span>
              </button>
            </div>
          )}

          {/* Instant Deploy Action Button with Real URLs */}
          <button
            onClick={() => setShowDeployModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98]"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Instant Deploy</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 mt-4 overflow-hidden flex items-center justify-center min-h-[640px]">
        {activeTab === "preview" ? (
          /* Mobile Phone Frame Simulator */
          <div className="relative w-[380px] h-[670px] bg-[#050608] rounded-[44px] border-[5px] border-zinc-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden ring-1 ring-white/10">
            {/* Phone Top Speaker & Dynamic Island */}
            <div className="h-7 bg-[#08090a] px-6 flex justify-between items-center z-20">
              <span className="text-[10px] font-mono text-zinc-400 font-semibold">9:41</span>
              <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700" />
              </div>
              <div className="flex items-center space-x-1.5 text-zinc-400">
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* In-app Browser URL bar pointing to the REAL working URL */}
            <div className="bg-[#0e1118] px-3 py-1.5 border-b border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <a
                href={realStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 truncate hover:text-white transition-colors"
                title="Click to open live store in browser"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="truncate">{realStoreUrl}</span>
                <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
              </a>
              <button
                onClick={copyStoreUrl}
                title="Copy Store URL"
                className="p-1 hover:text-white transition-colors flex-shrink-0"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
              </button>
            </div>

            {/* Mobile Store Header */}
            <div className="bg-gradient-to-b from-[#11141e] to-[#0a0c12] border-b border-white/[0.08] p-3.5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xs text-white truncate max-w-[200px]">
                  {storeSchema?.store_title || "Mama Cass Market"}
                </h3>
                <p className="text-[10px] text-zinc-400 truncate">
                  {storeSchema?.location || "Akure, Nigeria"} • Open Now
                </p>
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[10px] font-mono font-bold text-emerald-300">
                Cart: {totalItems}
              </div>
            </div>

            {/* Mobile Product Feed with REAL Product Photography */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 pb-24 no-scrollbar">
              {inventory.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-zinc-500 text-xs text-center p-4">
                  <ShoppingBag className="w-8 h-8 opacity-30 mb-2" />
                  <span>Storefront empty. Complete Step 1 scan to synthesize products.</span>
                </div>
              ) : (
                inventory.map((item) => (
                  <div
                    key={item.item_id}
                    className="p-2.5 bg-[#0e1118] border border-white/[0.06] rounded-xl flex gap-3 items-center shadow-sm"
                  >
                    {/* Real Product Photo */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-950 border border-white/10 flex-shrink-0">
                      <img
                        src={
                          item.image_url ||
                          "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
                        }
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-zinc-100 truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                          {item.suggested_price.toLocaleString()} {currency}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">
                          Qty: {item.estimated_quantity}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <button
                      onClick={() => addToCart(item.item_id)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950 rounded-lg text-[10px] font-bold shadow-sm transition-all flex-shrink-0"
                    >
                      + Add {cart[item.item_id] ? `(${cart[item.item_id]})` : ""}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Sticky WhatsApp Checkout Bar */}
            {totalItems > 0 && (
              <div className="absolute bottom-3 left-3 right-3 p-3 bg-[#0e1118]/95 backdrop-blur-md border border-white/10 rounded-2xl flex justify-between items-center shadow-2xl z-20">
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase font-mono block">
                    Total Due
                  </span>
                  <span className="text-xs font-bold font-mono text-emerald-400 tabular-nums">
                    {totalPrice.toLocaleString()} {currency}
                  </span>
                </div>
                <button
                  onClick={handleWhatsAppOrder}
                  className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-black font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-950 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Order on WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Code Inspector View */
          <div className="w-full h-full flex flex-col bg-[#050608] rounded-xl border border-white/[0.08] overflow-hidden">
            {/* File Tab Strip */}
            <div className="flex items-center justify-between bg-[#0e1118] px-3.5 py-2 border-b border-white/[0.08]">
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                {Object.keys(files).map((fileName) => (
                  <button
                    key={fileName}
                    onClick={() => setSelectedFile(fileName)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors active:scale-95 ${
                      selectedFile === fileName
                        ? "bg-purple-600 text-white font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    {fileName}
                  </button>
                ))}
              </div>

              <button
                onClick={copyCode}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono text-zinc-300 hover:text-white bg-[#141722] border border-white/10 transition-colors active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Code Body */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-zinc-300 leading-relaxed bg-[#050608]">
              <pre className="text-emerald-300/90 leading-relaxed font-mono">
                {files[selectedFile] || "// Synthesizing repository files with Muse Code..."}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* REAL INSTANT DEPLOY MODAL (Fixes Instant Deploy with Real Working URLs) */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#08090a] border border-white/15 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowDeployModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[10px] font-mono text-emerald-300 font-bold">
                <Rocket className="w-3 h-3 text-emerald-400" />
                <span>Production Storefront Ready</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Deploy &amp; Share {storeSchema?.store_title || "Market Store"}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your synthesized Next.js 14 mobile storefront with WhatsApp checkout is compiled. Choose how you want to deploy or access it:
              </p>
            </div>

            {/* Option 1: Real Live Working Storefront URL */}
            <div className="p-4 rounded-2xl bg-[#0e1118] border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Option 1: Live Interactive Storefront</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  Active Now
                </span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Browse the live customer web app on this server with cart and WhatsApp order routing.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={realStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-[0.98]"
                >
                  <span>Open Live Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={copyStoreUrl}
                  className="px-3 py-2 rounded-xl bg-[#141722] hover:bg-[#1c2130] border border-white/10 text-xs font-mono text-zinc-200 transition-colors active:scale-[0.98]"
                >
                  {copiedUrl ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>

            {/* Option 2: 1-Click WhatsApp Customer Broadcast */}
            <div className="p-4 rounded-2xl bg-[#0e1118] border border-green-500/30 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Share2 className="w-4 h-4 text-green-400" />
                  <span>Option 2: 1-Click WhatsApp Broadcast</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-300 text-[10px] font-mono font-bold">
                  Merchant Kit
                </span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Instantly broadcast your new digital storefront link to your WhatsApp customer lists and status updates.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleShareWhatsAppBroadcast}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-bold text-xs shadow-md transition-all active:scale-[0.98]"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Broadcast on WhatsApp</span>
                </button>
                <button
                  onClick={handleCopyPromoText}
                  className="px-3.5 py-2 rounded-xl bg-[#141722] hover:bg-[#1c2130] border border-white/10 text-xs font-mono text-zinc-200 transition-colors flex items-center space-x-1.5 active:scale-[0.98]"
                  title="Copy pre-formatted promotional message"
                >
                  {copiedPromo ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPromo ? "Copied" : "Copy Promo"}</span>
                </button>
              </div>
            </div>

            {/* Option 3: Export Standalone Storefront Code */}
            <div className="p-4 rounded-2xl bg-[#0e1118] border border-purple-500/30 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span>Option 3: Export Standalone Storefront Code</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                  Muse Code AST
                </span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Download only the synthesized storefront code bundle (<code className="text-purple-300 font-mono text-[10px]">app/page.tsx</code>, <code className="text-purple-300 font-mono text-[10px]">checkout/route.ts</code>) without your backend repository.
              </p>
              <button
                onClick={handleDownloadCode}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-[#1c2030] hover:bg-[#252b40] border border-purple-500/40 text-purple-200 font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Download Storefront Code Bundle (.json)</span>
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                onClick={() => setShowDeployModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200 font-mono transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
