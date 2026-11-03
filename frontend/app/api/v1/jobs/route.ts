import { NextResponse } from "next/server";
import { tryFastApiProxy } from "@/lib/server-api";

export async function GET(req: Request) {
  const proxyRes = await tryFastApiProxy("/api/v1/jobs", req);
  if (proxyRes && proxyRes.ok) {
    return proxyRes;
  }

  return NextResponse.json([
    {
      job_id: "job_01",
      job_type: "full_pipeline",
      status: "completed",
      progress: 1.0,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3590000).toISOString(),
    },
    {
      job_id: "job_02",
      job_type: "storefront_scan",
      status: "completed",
      progress: 1.0,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 1795000).toISOString(),
    },
  ]);
}

export async function POST(req: Request) {
  const proxyRes = await tryFastApiProxy("/api/v1/jobs", req);
  if (proxyRes && proxyRes.ok) {
    return proxyRes;
  }

  const payload = await req.json().catch(() => ({}));
  return NextResponse.json({
    job_id: `job_${Date.now()}`,
    job_type: payload.job_type || "storefront_scan",
    status: "completed",
    progress: 1.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}
