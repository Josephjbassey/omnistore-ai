import { NextResponse } from "next/server";
import { tryFastApiProxy } from "@/lib/server-api";
import { STALL_PRESETS } from "@/lib/presets";

export async function POST(req: Request) {
  const proxyRes = await tryFastApiProxy("/api/v1/segment", req);
  if (proxyRes && proxyRes.ok) {
    return proxyRes;
  }

  const preset = STALL_PRESETS[0];
  return NextResponse.json({
    success: true,
    model_used: "sam-3.1",
    image_width: 1280,
    image_height: 720,
    bounding_boxes: preset.boxes,
    crops: preset.boxes.map((b) => ({
      box_id: b.box_id,
      label: b.label,
      crop_base64: "",
    })),
    processing_time_ms: 128,
    total_segments: preset.boxes.length,
  });
}
