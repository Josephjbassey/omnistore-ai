import { NextResponse } from "next/server";
import { tryFastApiProxy } from "@/lib/server-api";

export async function POST(req: Request) {
  const proxyRes = await tryFastApiProxy("/api/v1/code/generate", req);
  if (proxyRes && proxyRes.ok) {
    return proxyRes;
  }

  const payload = await req.json().catch(() => ({}));
  const schema = payload.store_schema || payload;
  const storeName = schema.store_name || "Mama Cass Market";
  const whatsapp = schema.whatsapp_number || "+2348012345678";
  const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return NextResponse.json({
    success: true,
    model_used: "muse-code",
    framework: "nextjs14_tailwind",
    preview_url: `${appUrl}/store/${slug}`,
    generation_time_ms: 142,
    files: {
      "app/page.tsx": `// Next.js 14 Storefront synthesized by Muse Code for ${storeName}
import React from "react";
import Image from "next/image";

export default function StorefrontPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-4">
      <header className="mb-6 border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold">${storeName}</h1>
        <p className="text-xs text-slate-400">Order directly via WhatsApp</p>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {/* Render catalog products */}
      </div>
    </main>
  );
}`,
      "app/api/checkout/route.ts": `// WhatsApp Checkout API handler
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { cart, customer_name } = await req.json();
  const summary = cart.map((i: any) => \`\${i.name} (x\${i.quantity})\`).join(", ");
  const waUrl = \`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=\${encodeURIComponent(
    \`Hello! I would like to order: \${summary}. Name: \${customer_name}\`
  )}\`;
  return NextResponse.json({ success: true, redirect_url: waUrl });
}`,
      "prisma/schema.prisma": `datasource db {
  provider = "sqlite"
  url      = "file:./store.db"
}

generator client {
  provider = "prisma-client-js"
}

model Product {
  id          String   @id @default(cuid())
  name        String
  category    String
  price       Float
  stock       Int
  imageUrl    String?
  createdAt   DateTime @default(now())
}`,
    },
  });
}
