import { NextResponse } from "next/server";
import { testMetaApiKey, extractMetaApiKey } from "@/lib/server-api";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const key = body.apiKey || body.api_key || extractMetaApiKey(req);

    if (!key) {
      return NextResponse.json(
        {
          valid: false,
          message: "API key is missing. Please provide your Meta Model API key.",
          models: [],
        },
        { status: 400 }
      );
    }

    const result = await testMetaApiKey(key);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        valid: false,
        message: `Validation error: ${err.message}`,
        models: [],
      },
      { status: 500 }
    );
  }
}
