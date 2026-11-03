import { NextResponse } from "next/server";
import { checkFastApiHealth, extractMetaApiKey } from "@/lib/server-api";

export async function GET(req: Request) {
  const metaKey = extractMetaApiKey(req);
  const fastApi = await checkFastApiHealth();

  return NextResponse.json({
    status: "healthy",
    assistant: "OmniStore AI (Jenna Platform)",
    version: "2.1.0",
    engine: fastApi.running ? "FastAPI & Next.js Hybrid" : "Next.js Edge Engine",
    fastapi_connected: fastApi.running,
    fastapi_url: fastApi.running ? "http://127.0.0.1:8000" : null,
    docs_url: fastApi.running ? "http://127.0.0.1:8000/docs" : null,
    meta_api_configured: Boolean(metaKey),
    active_providers: {
      meta_model_api: Boolean(metaKey),
      sam_3_1: true,
      muse_spark_1_3: true,
      muse_code: true,
      background_queue: true,
      cross_agent_memory: true,
    },
    meta_hackathon: {
      track: "Build for Your World",
      credits: "$150 Grant Active",
      portal: "https://dev.meta.ai",
      models: ["sam-3.1", "muse-spark-1.3", "muse-code"],
    },
  });
}
