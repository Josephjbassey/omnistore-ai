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
  RotateCcw,
  Wifi,
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
import { compressStallImage } from "@/lib/image-compress";

interface SegmentCanvasProps {
  merchantContext: MerchantContext;
  onUpdateMerchantContext: (ctx: MerchantContext) => void;
  onPipelineComplete: (result: PipelineResponse) => void;
  onSelectBox: (box: BoundingBox) => void;
  selectedBoxId?: string | null;
  stallImageUrl?: string;
  inventoryThumbnails?: Record<string, string>;
}

export const SegmentCanvas: React.FC<SegmentCanvasProps> = ({
  merchantContext,
  onUpdateMerchantContext,
  onPipelineComplete,
  onSelectBox,
  selectedBoxId: externalSelectedBoxId,
  stallImageUrl = "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1280&q=80",
  inventoryThumbnails = {},
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [segmentData, setSegmentData] = useState<SegmentResponse | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [internalSelectedBoxId, setInternalSelectedBoxId] = useState<string | null>("seg_001");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<{
    originalKb: number;
    compressedKb: number;
    reduction: number;
  } | null>(null);

  const selectedBoxId = externalSelectedBoxId || internalSelectedBoxId;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const executeFullScan = useCallback(
    async (uploadedBase64?: string) => {
      setIsScanning(true);
      try {
        const payloadImage =
          uploadedBase64 ||
          customImage ||
          stallImageUrl ||
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
    },
    [customImage, stallImageUrl, merchantContext, onPipelineComplete, onSelectBox]
  );

  // Sync internal selection when external changes
  useEffect(() => {
    if (externalSelectedBoxId) {
      setInternalSelectedBoxId(externalSelectedBoxId);
    }
  }, [externalSelectedBoxId]);

  // Initial scan on mount
  useEffect(() => {
    if (!segmentData) {
      executeFullScan();
    }
  }, [executeFullScan, segmentData]);

  // Handle client-side image optimization
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const optimized = await compressStallImage(file, 1280, 0.82);
      setCompressionInfo({
        originalKb: Math.round(optimized.originalSizeBytes / 1024),
        compressedKb: Math.round(optimized.compressedSizeBytes / 1024),
        reduction: optimized.reductionPercentage,
      });
      setCustomImage(optimized.dataUrl);
      executeFullScan(optimized.dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const b64 = event.target?.result as string;
        setCustomImage(b64);
        executeFullScan(b64);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleResetToPreset = () => {
    setCustomImage(null);
    setCompressionInfo(null);
    executeFullScan();
  };

  // Draw SAM 3.1 Overlays on HTML5 Canvas in Judge Mode only
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!segmentData) return;

    segmentData.bounding_boxes.forEach((box) => {
      const [ymin, xmin, ymax, xmax] = box.bbox;
      const x = xmin * canvas.width;
      const y = ymin * canvas.height;
      const boxW = (xmax - xmin) * canvas.width;
      const boxH = (ymax - ymin) * canvas.height;

      const isSelected = box.box_id === selectedBoxId;
      const isHovered = box.box_id === hoveredBoxId;

      ctx.save();

      // Rounded rectangle
      const radius = 6;
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

      ctx.fillStyle = isSelected
        ? "rgba(193, 121, 63, 0.22)"
        : isHovered
        ? "rgba(82, 101, 105, 0.25)"
        : "rgba(15, 20, 30, 0.15)";
      ctx.fill();

      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.strokeStyle = isSelected ? "#c1793f" : "#526569";
      ctx.stroke();

      // Label text
      const labelText = `${box.label} (${(box.confidence * 100).toFixed(0)}%)`;
      ctx.font = "600 11px -apple-system, sans-serif";
      const metrics = ctx.measureText(labelText);
      const tagW = metrics.width + 12;
      const tagH = 20;
      const tagY = Math.max(4, y - tagH - 2);
      const tagX = Math.min(x, canvas.width - tagW - 4);

      ctx.fillStyle = isSelected ? "#c1793f" : "#1e2533";
      ctx.fillRect(tagX, tagY, tagW, tagH);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(labelText, tagX + 6, tagY + 14);

      ctx.restore();
    });
  }, [segmentData, hoveredBoxId, selectedBoxId]);

  return (
    <div className="flex flex-col h-full bg-[#10141d] rounded-2xl border border-white/[0.08] p-4 sm:p-5 shadow-sm">
      {/* Merchant Context Row (Store Details) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pb-3.5 border-b border-white/[0.08]">
        <div>
          <label className="text-[10px] uppercase font-mono text-[#cab695] block mb-1 font-semibold tracking-wider">
            Store Name
          </label>
          <div className="flex items-center space-x-2 bg-[#141924] border border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-[#c1793f] transition-colors">
            <Store className="w-3.5 h-3.5 text-[#c1793f] flex-shrink-0" />
            <input
              type="text"
              value={merchantContext.store_name}
              onChange={(e) =>
                onUpdateMerchantContext({ ...merchantContext, store_name: e.target.value })
              }
              className="bg-transparent text-xs text-white font-medium focus:outline-none w-full"
              placeholder="Store Name"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-[#cab695] block mb-1 font-semibold tracking-wider">
            Market Location
          </label>
          <div className="flex items-center space-x-2 bg-[#141924] border border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-[#c1793f] transition-colors">
            <MapPin className="w-3.5 h-3.5 text-[#526569] flex-shrink-0" />
            <input
              type="text"
              value={merchantContext.location}
              onChange={(e) =>
                onUpdateMerchantContext({ ...merchantContext, location: e.target.value })
              }
              className="bg-transparent text-xs text-white font-medium focus:outline-none w-full"
              placeholder="e.g. Akure Market Hub"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-[#cab695] block mb-1 font-semibold tracking-wider">
            Currency
          </label>
          <div className="flex items-center space-x-2 bg-[#141924] border border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-[#c1793f] transition-colors">
            <DollarSign className="w-3.5 h-3.5 text-[#c1793f] flex-shrink-0" />
            <select
              value={merchantContext.currency}
              onChange={(e) =>
                onUpdateMerchantContext({ ...merchantContext, currency: e.target.value })
              }
              className="bg-transparent text-xs text-white font-medium focus:outline-none w-full"
            >
              <option value="NGN" className="bg-[#141924]">NGN (₦ Naira)</option>
              <option value="USD" className="bg-[#141924]">USD ($ Dollar)</option>
              <option value="KES" className="bg-[#141924]">KES (KSh Shilling)</option>
              <option value="GHS" className="bg-[#141924]">GHS (GH₵ Cedi)</option>
              <option value="ZAR" className="bg-[#141924]">ZAR (R Rand)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-[#cab695] block mb-1 font-semibold tracking-wider">
            WhatsApp Order Line
          </label>
          <div className="flex items-center space-x-2 bg-[#141924] border border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-[#25D366] transition-colors">
            <Phone className="w-3.5 h-3.5 text-[#25D366] flex-shrink-0" />
            <input
              type="text"
              value={merchantContext.whatsapp_number || ""}
              onChange={(e) =>
                onUpdateMerchantContext({ ...merchantContext, whatsapp_number: e.target.value })
              }
              className="bg-transparent text-xs text-white focus:outline-none w-full font-mono font-medium"
              placeholder="+2348012345678"
            />
          </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
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
        <div className="flex items-center space-x-2">
          <Camera className="w-4 h-4 text-[#c1793f]" />
          <h2 className="font-semibold text-xs text-white">Stall Photography</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#182030] text-[#cab695] border border-white/10">
            Live Shelf
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {compressionInfo && (
            <div
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#182030] border border-white/10 text-zinc-300 text-[10px] font-mono"
              title="Optimized for African 3G Mobile Networks"
            >
              <Wifi className="w-3 h-3 text-[#10b981]" />
              <span>3G Optimized: {compressionInfo.compressedKb}KB (-{compressionInfo.reduction}%)</span>
            </div>
          )}

          {customImage && (
            <button
              onClick={handleResetToPreset}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-mono text-zinc-400 hover:text-white bg-[#141924] border border-white/10 transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Primary Mobile Camera Snap */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isCompressing || isScanning}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#c1793f] hover:bg-[#d68749] text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCompressing ? "Optimizing..." : "Take Stall Photo"}</span>
          </button>

          {/* Upload Fallback */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing || isScanning}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#141924] hover:bg-[#1b2232] text-zinc-300 border border-white/10 transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Upload Photo</span>
          </button>

          {/* Re-catalog Action */}
          <button
            onClick={() => executeFullScan(customImage || undefined)}
            disabled={isScanning || isCompressing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#182030] hover:bg-[#202b40] text-[#cab695] border border-[#c1793f]/30 transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Scanning..." : "Update Inventory"}</span>
          </button>
        </div>
      </div>

      {/* Main Photographic Shelf Viewport */}
      <div className="relative flex-1 min-h-[360px] bg-[#07090e] rounded-xl overflow-hidden border border-white/[0.08] flex items-center justify-center shadow-inner">
        <img
          src={
            customImage ||
            stallImageUrl ||
            "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1280&q=80"
          }
          alt={`${merchantContext.store_name} Shelf`}
          className="w-full h-full object-cover select-none brightness-[0.85] contrast-[1.05]"
        />

        <div className="absolute top-3 left-3 flex items-center space-x-2 z-10 pointer-events-none">
          <span className="px-2.5 py-0.5 rounded-md bg-[#090b10]/90 border border-white/10 text-[11px] font-mono text-[#cab695] font-semibold backdrop-blur-md">
            {merchantContext.store_name} · Current Display
          </span>
        </div>

        {/* Interactive Canvas */}
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

      {/* Detected Goods Strip */}
      {segmentData && segmentData.bounding_boxes.length > 0 && (
        <div className="pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 text-xs text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="font-semibold text-white">Cataloged Items ({segmentData.bounding_boxes.length})</span>
            <span className="text-zinc-500 text-[11px]">· select to inspect:</span>
          </div>

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
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-2 whitespace-nowrap active:scale-[0.98] ${
                    isSelected
                      ? "bg-[#c1793f] text-white font-bold border-[#c1793f] shadow-sm"
                      : "bg-[#141924] text-zinc-300 border-white/10 hover:border-white/25 hover:text-white"
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
                  <span className="text-[10px] font-mono text-[#cab695]">
                    {(box.confidence * 100).toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
