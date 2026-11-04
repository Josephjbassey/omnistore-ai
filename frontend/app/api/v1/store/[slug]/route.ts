import { NextResponse } from "next/server";
import { getStoreFromCache, saveStoreToCache } from "@/lib/store-cache";
import { STALL_PRESETS } from "@/lib/presets";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const slug = (params?.slug || "lagos-produce").toLowerCase().trim();

  // 1. Check dynamic cache first
  const cached = getStoreFromCache(slug);
  if (cached) {
    return NextResponse.json({ success: true, schema: cached });
  }

  // 2. Check presets
  const matched = STALL_PRESETS.find(
    (p) =>
      p.id === slug ||
      p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug ||
      p.name.toLowerCase().replace(/\s+/g, "-") === slug
  );

  if (matched) {
    return NextResponse.json({ success: true, schema: matched.schema });
  }

  // Fallback to first preset
  return NextResponse.json({ success: true, schema: STALL_PRESETS[0].schema });
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = (params?.slug || "custom-store").toLowerCase().trim();
    const body = await req.json();
    const schema = body.schema || body;

    saveStoreToCache(slug, schema);
    return NextResponse.json({ success: true, slug });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save store" },
      { status: 500 }
    );
  }
}
