import { NextResponse } from "next/server";
import { tryFastApiProxy } from "@/lib/server-api";

export async function GET(req: Request) {
  const proxyRes = await tryFastApiProxy("/api/v1/agent/roles", req);
  if (proxyRes && proxyRes.ok) {
    return proxyRes;
  }

  return NextResponse.json({
    roles: [
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
    ],
  });
}
