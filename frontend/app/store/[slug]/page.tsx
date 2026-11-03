"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Store,
  MapPin,
  PhoneCall,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ExternalLink,
  ArrowLeft,
  Share2,
  Sparkles,
  ShieldCheck,
  QrCode,
  X,
} from "lucide-react";
import { STALL_PRESETS, StallPreset } from "@/lib/presets";
import { StorefrontSchema, InventoryItem } from "@/lib/api";

export default function StorefrontPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "lagos-produce";

  // Find matching preset or fall back to first preset
  const matchedPreset =
    STALL_PRESETS.find(
      (p) =>
        p.id === slug ||
        p.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === slug ||
        p.name.toLowerCase().replace(/\s+/g, "-") === slug
    ) || STALL_PRESETS[0];

  const [schema, setSchema] = useState<StorefrontSchema>(matchedPreset.schema);
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const inventory = schema.inventory || [];
  const currency = schema.currency || "NGN";

  const categories = [
    "All",
    ...Array.from(new Set(inventory.map((i) => i.category))),
  ];

  const filteredItems =
    selectedCategory === "All"
      ? inventory
      : inventory.filter((i) => i.category === selectedCategory);

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[id] > 1) {
        next[id] -= 1;
      } else {
        delete next[id];
      }
      return next;
    });
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
          `- ${p.name} x${cart[p.item_id]} (${(
            p.suggested_price * cart[p.item_id]
          ).toLocaleString()} ${currency})`
      );
    const msg = encodeURIComponent(
      `Hello ${schema.store_title}! I would like to place an order from your online store:\n\n${lines.join(
        "\n"
      )}\n\n*Total Due:* ${totalPrice.toLocaleString()} ${currency}\n\nDelivery Location: Please confirm delivery or pickup.`
    );
    const phone =
      schema.whatsapp_number?.replace(/[^0-9]/g, "") || "2348012345678";
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const copyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Bar for OmniStore AI Context */}
      <header className="sticky top-0 z-50 bg-[#0c0f16]/95 backdrop-blur-md border-b border-white/[0.08] px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Back to OmniStore AI Studio</span>
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-[#141924] hover:bg-[#1a2232] text-slate-300 border border-white/10 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Stall QR</span>
            </button>

            <button
              onClick={copyShareLink}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-[#141924] hover:bg-[#1a2232] text-slate-300 border border-white/10 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>

            <a
              href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJosephjbassey%2Fomnistore-ai&project-name=omnistore-storefront&repository-name=omnistore-storefront"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-200 text-black shadow-sm transition-all"
            >
              <span>Instant Deploy</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Storefront Banner with Real Stall Photo */}
      <div className="relative w-full h-48 sm:h-64 bg-slate-900 overflow-hidden border-b border-white/[0.08]">
        <img
          src={matchedPreset.image_url}
          alt={schema.store_title}
          className="w-full h-full object-cover object-center brightness-[0.7]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080a0f] via-[#080a0f]/40 to-transparent" />

        <div className="absolute bottom-4 left-4 right-4 max-w-4xl mx-auto flex items-end justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[10px] font-mono text-emerald-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Verified Market Merchant · Physical Inventory Live</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-md">
              {schema.store_title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{schema.location}</span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-400 font-medium">WhatsApp Orders Active</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Catalog Viewport */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-28 space-y-5">
        {/* Category Filter Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-glow-emerald"
                  : "bg-[#121622] text-slate-300 hover:text-white border border-white/10 hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid with REAL Product Photography */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const countInCart = cart[item.item_id] || 0;
            return (
              <div
                key={item.item_id}
                className="bg-[#0e121a] border border-white/[0.08] hover:border-white/20 rounded-2xl p-3.5 flex flex-col justify-between transition-all group shadow-sm hover:shadow-xl hover:bg-[#121722]"
              >
                <div>
                  {/* Real Product Photo */}
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-900 border border-white/5 mb-3">
                    <img
                      src={
                        item.image_url ||
                        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#080a0f]/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
                      {item.category}
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-md border border-emerald-800 text-[10px] font-mono text-emerald-300">
                      Stock: {item.estimated_quantity}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-white group-hover:text-emerald-300 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">
                      Price
                    </span>
                    <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">
                      {item.suggested_price.toLocaleString()} {currency}
                    </span>
                  </div>

                  {countInCart === 0 ? (
                    <button
                      onClick={() => addToCart(item.item_id)}
                      className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 bg-[#161c28] border border-white/10 rounded-xl p-1">
                      <button
                        onClick={() => removeFromCart(item.item_id)}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold text-white px-1">
                        {countInCart}
                      </span>
                      <button
                        onClick={() => addToCart(item.item_id)}
                        className="w-6 h-6 rounded-lg bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-slate-950"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Sticky Bottom WhatsApp Checkout Drawer */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto">
          <div className="bg-[#121622]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                <span>{totalItems} items in order</span>
              </div>
              <div className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                {totalPrice.toLocaleString()} {currency}
              </div>
            </div>

            <button
              onClick={handleWhatsAppOrder}
              className="flex items-center space-x-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-black font-bold rounded-xl text-xs shadow-lg shadow-emerald-950 transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Order on WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* QR Code Modal for Physical Market Stall Placard */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e121a] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-white">
                Stall QR Poster
              </h3>
              <p className="text-xs text-slate-400">
                Print or display this QR code at {schema.store_title} for walk-up shoppers to browse on mobile.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl flex items-center justify-center shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.href : "https://omnistore-demo.vercel.app"
                )}`}
                alt="Store QR Code"
                className="w-48 h-48"
              />
            </div>

            <div className="text-center">
              <span className="text-[11px] font-mono text-slate-400 break-all">
                {typeof window !== "undefined" ? window.location.href : ""}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
