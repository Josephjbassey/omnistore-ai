import { NextResponse } from "next/server";
import { tryFastApiProxy } from "@/lib/server-api";

export async function GET(req: Request) {
  const proxyRes = await tryFastApiProxy("/api/v1/memory/stats", req);
  if (proxyRes && proxyRes.ok) {
    return proxyRes;
  }

  return NextResponse.json({
    total_memories: 48,
    active_sessions: 3,
    storage_type: "sqlite_in_memory",
    top_categories: ["Produce", "Staples", "Beverages", "Spices"],
    last_synced: new Date().toISOString(),
  });
}
