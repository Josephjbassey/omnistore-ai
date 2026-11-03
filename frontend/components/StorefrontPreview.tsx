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
} from "lucide-react";
import { StorefrontSchema, CodeGenerateResponse, resolveStorefrontUrl, getAppUrl } from "@/lib/api";

interface StorefrontPreviewProps {
  storeSchema: StorefrontSchema | null;
  codeResponse: CodeGenerateResponse | null;
}

export const StorefrontPreview: React.FC<StorefrontPreviewProps> = ({
  storeSchema,
  codeResponse,
}) => {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [selectedFile, setSelectedFile] = useState<string>("app/page.tsx");
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const inventory = storeSchema?.inventory || [];
  const currency = storeSchema?.currency || "NGN";
  const files = codeResponse?.repository_files || {};

  const storeSlug = storeSchema?.store_title
    ? storeSchema.store_title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")
    : "lagos-produce";

  // Real live working storefront URL on this application
  const realStoreUrl = `${getAppUrl()}/store/${storeSlug}`;

  // Real 1-Click Vercel Deploy URL for GitHub repo
  const vercelDeployUrl = `https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJosephjbassey%2Fomnistore-ai&project-name=omnistore-storefront&repository-name=omnistore-storefront`;

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
    <div className="flex flex-col h-full bg-[#0b0e14] rounded-2xl border border-white/[0.08] p-4 sm:p-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-white/[0.08] gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-xs text-slate-100 uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <span>Muse Code</span>
              <span className="text-[10px] text-emerald-400 font-normal lowercase">(synthesized PWA &amp; storefront)</span>
            </h2>
            <p className="text-[10px] text-slate-400">
              Mobile-first web app with direct WhatsApp cart integration
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tab Switcher: Mobile Live View vs. Generated Code */}
          <div className="flex items-center space-x-1 bg-[#121622] border border-white/10 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "preview"
                  ? "bg-emerald-500 text-slate-950 shadow-sm font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Live View</span>
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "code"
                  ? "bg-purple-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Generated Code ({Object.keys(files).length || 4})</span>
            </button>
          </div>

          {/* Instant Deploy Action Button with Real URLs */}
          <button
            onClick={() => setShowDeployModal(true)}
            className="btn-command-emerald flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-glow-emerald"
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
          <div className="relative w-[380px] h-[670px] bg-[#07090e] rounded-[44px] border-[5px] border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden ring-1 ring-white/10">
            {/* Phone Top Speaker & Dynamic Island */}
            <div className="h-7 bg-[#0b0e14] px-6 flex justify-between items-center z-20">
              <span className="text-[10px] font-mono text-slate-400 font-semibold">9:41</span>
              <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400">
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* In-app Browser URL bar pointing to the REAL working URL */}
            <div className="bg-[#121622] px-3 py-1.5 border-b border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-slate-400">
              <a
                href={realStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 truncate hover:text-white transition-colors"
                title="Click to open live store in browser"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="truncate">{realStoreUrl}</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
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
            <div className="bg-gradient-to-b from-[#141b27] to-[#0f141d] border-b border-white/[0.08] p-3.5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xs text-white truncate max-w-[200px]">
                  {storeSchema?.store_title || "Mama Cass Market"}
                </h3>
                <p className="text-[10px] text-slate-400 truncate">
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
                <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                  <ShoppingBag className="w-8 h-8 opacity-30 mb-2" />
                  <span>Storefront empty. Complete Step 1 scan to synthesize products.</span>
                </div>
              ) : (
                inventory.map((item) => (
                  <div
                    key={item.item_id}
                    className="p-2.5 bg-[#111520] border border-white/[0.06] rounded-xl flex gap-3 items-center shadow-sm"
                  >
                    {/* Real Product Photo */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex-shrink-0">
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
                      <h4 className="font-semibold text-xs text-slate-100 truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                          {item.suggested_price.toLocaleString()} {currency}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          Qty: {item.estimated_quantity}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <button
                      onClick={() => addToCart(item.item_id)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:translate-y-0.5 text-slate-950 rounded-lg text-[10px] font-bold shadow-sm transition-all flex-shrink-0"
                    >
                      + Add {cart[item.item_id] ? `(${cart[item.item_id]})` : ""}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Sticky WhatsApp Checkout Bar */}
            {totalItems > 0 && (
              <div className="absolute bottom-3 left-3 right-3 p-3 bg-[#111622]/95 backdrop-blur-md border border-white/10 rounded-2xl flex justify-between items-center shadow-2xl z-20">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">
                    Total Due
                  </span>
                  <span className="text-xs font-bold font-mono text-emerald-400 tabular-nums">
                    {totalPrice.toLocaleString()} {currency}
                  </span>
                </div>
                <button
                  onClick={handleWhatsAppOrder}
                  className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] active:translate-y-0.5 text-black font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-950 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Order on WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Code Inspector View */
          <div className="w-full h-full flex flex-col bg-[#07090e] rounded-xl border border-white/[0.08] overflow-hidden">
            {/* File Tab Strip */}
            <div className="flex items-center justify-between bg-[#111520] px-3.5 py-2 border-b border-white/[0.08]">
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                {Object.keys(files).map((fileName) => (
                  <button
                    key={fileName}
                    onClick={() => setSelectedFile(fileName)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                      selectedFile === fileName
                        ? "bg-purple-600 text-white font-semibold shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    {fileName}
                  </button>
                ))}
              </div>

              <button
                onClick={copyCode}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-[#161c28] border border-white/10 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Code Body */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed bg-[#07090e]">
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
          <div className="bg-[#0b0e14] border border-white/15 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowDeployModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
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
              <p className="text-xs text-slate-400 leading-relaxed">
                Your synthesized Next.js 14 mobile storefront with WhatsApp checkout is compiled. Choose how you want to deploy or access it:
              </p>
            </div>

            {/* Option 1: Real Live Working Storefront URL */}
            <div className="p-4 rounded-2xl bg-[#121622] border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Option 1: Live Interactive Storefront</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  Active Now
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Browse the live customer web app on this server with cart and WhatsApp order routing.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={realStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  <span>Open Live Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={copyStoreUrl}
                  className="px-3 py-2 rounded-xl bg-[#161c28] hover:bg-[#202838] border border-white/10 text-xs font-mono text-slate-200 transition-colors"
                >
                  {copiedUrl ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>

            {/* Option 2: Real 1-Click Vercel Deploy URL */}
            <div className="p-4 rounded-2xl bg-[#121622] border border-purple-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <ExternalLink className="w-4 h-4 text-purple-400" />
                  <span>Option 2: 1-Click Vercel Cloud Deploy</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                  GitHub &amp; Vercel
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Deploy directly to your own Vercel account from the official GitHub repository (<code className="text-purple-300 font-mono text-[10px]">Josephjbassey/omnistore-ai</code>).
              </p>
              <a
                href={vercelDeployUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-white hover:bg-slate-200 text-black font-bold text-xs shadow-md transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 1155 1000" fill="currentColor">
                  <path d="m577.3 0 577.4 1000H0z" />
                </svg>
                <span>Deploy to Vercel (1-Click)</span>
              </a>
            </div>

            <div className="text-center pt-1">
              <button
                onClick={() => setShowDeployModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200 font-mono transition-colors"
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
