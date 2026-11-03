"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Camera,
  Sparkles,
  MapPin,
  DollarSign,
  Phone,
  Store,
  Layers,
  Check,
  Eye,
  Crosshair,
  Maximize2,
  Scan,
  Image as ImageIcon,
} from "lucide-react";
import {
  BoundingBox,
  SegmentCrop,
  SegmentResponse,
  MerchantContext,
  PipelineResponse,
  scanStoreJson,
} from "@/lib/api";
import { ViewMode } from "./ModeToggleHeader";

interface SegmentCanvasProps {
  merchantContext: MerchantContext;
  onUpdateMerchantContext: (ctx: MerchantContext) => void;
  onPipelineComplete: (result: PipelineResponse) => void;
  onSelectBox: (box: BoundingBox) => void;
  selectedBoxId?: string | null;
  stallImageUrl?: string;
  inventoryThumbnails?: Record<string, string>;
  viewMode?: ViewMode;
}

export const SegmentCanvas: React.FC<SegmentCanvasProps> = ({
  merchantContext,
  onUpdateMerchantContext,
  onPipelineComplete,
  onSelectBox,
  selectedBoxId: externalSelectedBoxId,
  stallImageUrl = "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1280&q=80",
  inventoryThumbnails = {},
  viewMode = "merchant",
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [segmentData, setSegmentData] = useState<SegmentResponse | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [internalSelectedBoxId, setInternalSelectedBoxId] = useState<string | null>("seg_001");
  const [customImage, setCustomImage] = useState<string | null>(null);

  const selectedBoxId = externalSelectedBoxId || internalSelectedBoxId;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync internal selection when external changes
  useEffect(() => {
    if (externalSelectedBoxId) {
      setInternalSelectedBoxId(externalSelectedBoxId);
    }
  }, [externalSelectedBoxId]);

  const executeFullScan = useCallback(async (uploadedBase64?: string) => {
    setIsScanning(true);
    try {
      const payloadImage =
        uploadedBase64 ||
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const result = await scanStoreJson(
        payloadImage,
        merchantContext.store_name,
        merchantContext.currency,
        merchantContext.location,
        merchantContext.whatsapp_number
      );

      setSegmentData({
        success: true,
        model_used: "sam-3.1",
        image_width: 1280,
        image_height: 720,
        bounding_boxes: result.bounding_boxes,
        crops: [],
        processing_time_ms: result.processing_time_ms,
        total_segments: result.segments_found,
      });

      if (result.bounding_boxes.length > 0) {
        setInternalSelectedBoxId(result.bounding_boxes[0].box_id);
        onSelectBox(result.bounding_boxes[0]);
      }

      onPipelineComplete(result);
    } catch (err) {
      console.error("Storefront scan error:", err);
    } finally {
      setIsScanning(false);
    }
  }, [merchantContext, onPipelineComplete, onSelectBox]);

  // Initial scan on mount
  useEffect(() => {
    executeFullScan();
  }, [executeFullScan]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setCustomImage(b64);
      executeFullScan(b64);
    };
    reader.readAsDataURL(file);
  };

  // Draw SAM 3.1 Overlays on HTML5 Canvas over REAL stall photography
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!segmentData) return;

    // In Store Owner Mode: Hide raw bounding box overlays, coordinates, confidence tags; show clean photo preview
    if (viewMode === "merchant") {
      return;
    }

    segmentData.bounding_boxes.forEach((box) => {
      const [ymin, xmin, ymax, xmax] = box.bbox;
      const x = xmin * canvas.width;
      const y = ymin * canvas.height;
      const boxW = (xmax - xmin) * canvas.width;
      const boxH = (ymax - ymin) * canvas.height;

      const isSelected = box.box_id === selectedBoxId;
      const isHovered = box.box_id === hoveredBoxId;

      ctx.save();

      // If polygon mask exists, render polygon mask
      if (box.polygon_mask && box.polygon_mask.length > 2) {
        ctx.beginPath();
        const firstPt = box.polygon_mask[0];
        ctx.moveTo(firstPt[0] * canvas.width, firstPt[1] * canvas.height);
        for (let i = 1; i < box.polygon_mask.length; i++) {
          const pt = box.polygon_mask[i];
          ctx.lineTo(pt[0] * canvas.width, pt[1] * canvas.height);
        }
        ctx.closePath();

        // Polygon fill
        ctx.fillStyle = isSelected
          ? "rgba(16, 185, 129, 0.26)"
          : isHovered
          ? "rgba(56, 189, 248, 0.28)"
          : "rgba(56, 189, 248, 0.10)";
        ctx.fill();

        // Polygon stroke
        ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1.5;
        ctx.strokeStyle = isSelected
          ? "#10b981"
          : isHovered
          ? "#38bdf8"
          : "rgba(56, 189, 248, 0.65)";
        ctx.stroke();
      }

      // Draw refined rounded rectangle bounding box
      const radius = 8;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + boxW - radius, y);
      ctx.quadraticCurveTo(x + boxW, y, x + boxW, y + radius);
      ctx.lineTo(x + boxW, y + boxH - radius);
      ctx.quadraticCurveTo(x + boxW, y + boxH, x + boxW - radius, y + boxH);
      ctx.lineTo(x + radius, y + boxH);
      ctx.quadraticCurveTo(x, y + boxH, x, y + boxH - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      // Translucent box fill
      ctx.fillStyle = isSelected
        ? "rgba(16, 185, 129, 0.18)"
        : isHovered
        ? "rgba(56, 189, 248, 0.22)"
        : "rgba(14, 22, 36, 0.14)";
      ctx.fill();

      // Box stroke with subtle glow
      ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1.5;
      if (isSelected) {
        ctx.strokeStyle = "#10b981";
        ctx.shadowColor = "rgba(16, 185, 129, 0.8)";
        ctx.shadowBlur = 14;
      } else if (isHovered) {
        ctx.strokeStyle = "#38bdf8";
        ctx.shadowColor = "rgba(56, 189, 248, 0.7)";
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
        ctx.shadowBlur = 0;
      }
      ctx.stroke();

      // Reset shadow for text tags
      ctx.shadowBlur = 0;

      // Corner crosshairs on selected item
      if (isSelected) {
        const arm = 12;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(x, y + arm); ctx.lineTo(x, y); ctx.lineTo(x + arm, y);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + boxW - arm, y); ctx.lineTo(x + boxW, y); ctx.lineTo(x + boxW, y + arm);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x, y + boxH - arm); ctx.lineTo(x, y + boxH); ctx.lineTo(x + arm, y + boxH);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + boxW - arm, y + boxH); ctx.lineTo(x + boxW, y + boxH); ctx.lineTo(x + boxW, y + boxH - arm);
        ctx.stroke();
      }

      // Floating Category & Confidence Tag
      const labelText = `${box.label}`;
      const confText = `${(box.confidence * 100).toFixed(0)}%`;
      ctx.font = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      const labelMetrics = ctx.measureText(labelText);
      ctx.font = "bold 10px ui-monospace, SFMono-Regular, monospace";
      const confMetrics = ctx.measureText(confText);

      const tagW = labelMetrics.width + confMetrics.width + 24;
      const tagH = 22;
      const tagY = Math.max(6, y - tagH - 4);
      const tagX = Math.min(x, canvas.width - tagW - 8);

      // Tag pill background with high contrast
      ctx.beginPath();
      const r = 6;
      ctx.moveTo(tagX + r, tagY);
      ctx.lineTo(tagX + tagW - r, tagY);
      ctx.quadraticCurveTo(tagX + tagW, tagY, tagX + tagW, tagY + r);
      ctx.lineTo(tagX + tagW, tagY + tagH - r);
      ctx.quadraticCurveTo(tagX + tagW, tagY + tagH, tagX + tagW - r, tagY + tagH);
      ctx.lineTo(tagX + r, tagY + tagH);
      ctx.quadraticCurveTo(tagX, tagY + tagH, tagX, tagY + tagH - r);
      ctx.lineTo(tagX, tagY + r);
      ctx.quadraticCurveTo(tagX, tagY, tagX + r, tagY);
      ctx.closePath();

      ctx.fillStyle = isSelected
        ? "rgba(6, 78, 59, 0.95)"
        : isHovered
        ? "rgba(7, 43, 74, 0.95)"
        : "rgba(11, 17, 27, 0.92)";
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = isSelected
        ? "#10b981"
        : isHovered
        ? "#38bdf8"
        : "rgba(255, 255, 255, 0.25)";
      ctx.stroke();

      // Label text
      ctx.font = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = isSelected ? "#ecfdf5" : isHovered ? "#f0f9ff" : "#f1f5f9";
      ctx.fillText(labelText, tagX + 8, tagY + 15);

      // Confidence badge
      ctx.font = "bold 10px ui-monospace, SFMono-Regular, monospace";
      ctx.fillStyle = isSelected ? "#34d399" : isHovered ? "#38bdf8" : "#94a3b8";
      ctx.fillText(confText, tagX + labelMetrics.width + 14, tagY + 15);

      ctx.restore();
    });
  }, [segmentData, hoveredBoxId, selectedBoxId, viewMode]);

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] rounded-2xl border border-white/[0.08] p-4 sm:p-5 shadow-2xl backdrop-blur-md">
      {/* Merchant Context Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pb-3.5 border-b border-white/[0.08]">
        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-semibold tracking-wider">
            Store Name
          </label>
          <div className="flex items-center space-x-2 bg-[#121622] border border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500/60 transition-colors shadow-sm">
            <Store className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <input
              type="text"
              value={merchantContext.store_name}
              onChange={(e) =>
                onUpdateMerchantContext({ ...merchantContext, store_name: e.target.value })
              }
              className="bg-transparent text-xs text-slate-100 font-medium focus:outline-none w-full"
              placeholder="e.g. Mama Cass Market"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-semibold tracking-wider">
            Location
          </label>
          <div className="flex items-center space-x-2 bg-[#121622] border border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500/60 transition-colors shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <input
              type="text"
              value={merchantContext.location}
              onChange={(e) =>
                onUpdateMerchantContext({ ...merchantContext, location: e.target.value })
              }
              className="bg-transparent text-xs text-slate-100 font-medium focus:outline-none w-full"
              placeholder="Akure, Nigeria"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-semibold tracking-wider">
            Currency
          </label>
          <div className="flex items-center space-x-2 bg-[#121622] border border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500/60 transition-colors shadow-sm">
            <DollarSign className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <select
              value={merchantContext.currency}
              onChange={(e) =>
                onUpdateMerchantContext({ ...merchantContext, currency: e.target.value })
              }
              className="bg-transparent text-xs text-slate-100 font-medium focus:outline-none w-full"
            >
              <option value="NGN" className="bg-[#121622]">NGN (₦ Naira)</option>
              <option value="USD" className="bg-[#121622]">USD ($ Dollar)</option>
              <option value="KES" className="bg-[#121622]">KES (KSh Shilling)</option>
              <option value="GHS" className="bg-[#121622]">GHS (GH₵ Cedi)</option>
              <option value="ZAR" className="bg-[#121622]">ZAR (R Rand)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-semibold tracking-wider">
            WhatsApp Checkout
          </label>
          <div className="flex items-center space-x-2 bg-[#121622] border border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500/60 transition-colors shadow-sm">
            <Phone className="w-3.5 h-3.5 text-[#25D366] flex-shrink-0" />
            <input
              type="text"
              value={merchantContext.whatsapp_number || ""}
              onChange={(e) =>
                onUpdateMerchantContext({ ...merchantContext, whatsapp_number: e.target.value })
              }
              className="bg-transparent text-xs text-slate-100 focus:outline-none w-full font-mono font-medium"
              placeholder="+2348012345678"
            />
          </div>
        </div>
      </div>

      {/* Hidden File and Camera Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Action / Trigger Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        {viewMode === "judge" ? (
          <div className="flex items-center space-x-2">
            <span className="status-dot status-dot-cyan" />
            <h2 className="font-semibold text-xs text-slate-200 uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <span>SAM 3.1 Visual Canvas</span>
              <span className="text-[10px] text-cyan-400 lowercase font-normal">(real stall perception)</span>
            </h2>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-xs text-slate-100 flex items-center space-x-1.5">
              <span>Your Stall Photo</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
              1. Snap Stall
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {viewMode === "merchant" ? (
            <>
              {/* Primary Mobile Camera Snap Trigger */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="btn-command-emerald flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-glow-emerald active:scale-95"
                title="Open device camera to snap stall picture"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Stall Photo</span>
              </button>

              {/* Upload Picture Fallback */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#141924] hover:bg-[#1a2232] text-slate-300 border border-white/10 transition-colors shadow-sm active:scale-95"
                title="Select existing photo from gallery"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload Picture</span>
              </button>

              {/* Re-catalog Items CTA */}
              <button
                onClick={() => executeFullScan(customImage || undefined)}
                disabled={isScanning}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#182030] hover:bg-[#202b40] text-emerald-300 border border-emerald-500/30 transition-colors shadow-sm disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                <span>{isScanning ? "Cataloging Items..." : "Catalog Items"}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#141924] hover:bg-[#1a2232] text-slate-300 border border-white/10 transition-colors shadow-sm active:scale-95"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload Photo</span>
              </button>

              <button
                onClick={() => executeFullScan(customImage || undefined)}
                disabled={isScanning}
                className="btn-command-emerald flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-bold shadow-glow-emerald disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                <span>{isScanning ? "Extracting Spatial Masks..." : "1-Click Store Scan"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Photographic Shelf & Interactive Canvas Viewport */}
      <div className="relative flex-1 min-h-[360px] bg-[#07090e] rounded-xl overflow-hidden border border-white/[0.08] flex items-center justify-center group shadow-inner">
        {/* Render Real High-Resolution Stall Photography */}
        <img
          src={
            customImage ||
            stallImageUrl ||
            "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1280&q=80"
          }
          alt={`${merchantContext.store_name} Market Stall`}
          className="w-full h-full object-cover select-none brightness-[0.80] contrast-[1.08] pointer-events-none"
        />

        {/* Ambient Top Vignette */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#080a0f]/80 to-transparent pointer-events-none z-0" />
        <div className="absolute top-3 left-4 flex items-center space-x-2 z-10 pointer-events-none">
          <span className="px-2.5 py-0.5 rounded-md bg-[#080a0f]/85 border border-white/15 text-[11px] font-mono text-emerald-300 font-semibold backdrop-blur-md">
            {merchantContext.store_name} · {viewMode === "judge" ? "Real Stall Frame #042" : "Current Stall View"}
          </span>
        </div>

        {/* Interactive SAM 3.1 Bounding Box Canvas with 100% Click-to-Reason */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="absolute inset-0 w-full h-full object-contain cursor-crosshair z-10"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = (e.clientX - rect.left) / rect.width;
            const clickY = (e.clientY - rect.top) / rect.height;

            if (segmentData) {
              const clicked = segmentData.bounding_boxes.find((b) => {
                const [ymin, xmin, ymax, xmax] = b.bbox;
                return clickX >= xmin && clickX <= xmax && clickY >= ymin && clickY <= ymax;
              });
              if (clicked) {
                setInternalSelectedBoxId(clicked.box_id);
                onSelectBox(clicked);
              }
            }
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            if (segmentData) {
              const hovered = segmentData.bounding_boxes.find((b) => {
                const [ymin, xmin, ymax, xmax] = b.bbox;
                return x >= xmin && x <= xmax && y >= ymin && y <= ymax;
              });
              setHoveredBoxId(hovered ? hovered.box_id : null);
            }
          }}
          onMouseLeave={() => setHoveredBoxId(null)}
        />
      </div>

      {/* Segment Selector Quick Strip (With Real Product Thumbnails) */}
      {segmentData && segmentData.bounding_boxes.length > 0 && (
        <div className="pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {viewMode === "judge" ? (
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Detected:</span>
              <span className="text-white font-bold">{segmentData.bounding_boxes.length} SKUs</span>
              <span className="text-slate-500">· click to inspect cognitive reasoning</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-white">Detected Goods ({segmentData.bounding_boxes.length})</span>
              <span className="text-slate-500 text-[11px]">· select to view:</span>
            </div>
          )}

          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 no-scrollbar">
            {segmentData.bounding_boxes.map((box) => {
              const thumbUrl = inventoryThumbnails[box.box_id];
              const isSelected = box.box_id === selectedBoxId;
              return (
                <button
                  key={box.box_id}
                  onClick={() => {
                    setInternalSelectedBoxId(box.box_id);
                    onSelectBox(box);
                  }}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-2 whitespace-nowrap ${
                    isSelected
                      ? "bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm"
                      : "bg-[#141924] text-slate-300 border-white/10 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {thumbUrl && (
                    <img
                      src={thumbUrl}
                      alt={box.label}
                      className="w-4 h-4 rounded-full object-cover border border-white/20 flex-shrink-0"
                    />
                  )}
                  <span>{box.label}</span>
                  {viewMode === "judge" && (
                    <span
                      className={`text-[10px] font-mono ${
                        isSelected ? "text-slate-900" : "text-emerald-400"
                      }`}
                    >
                      {(box.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
