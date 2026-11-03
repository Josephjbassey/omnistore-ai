import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniStore AI — Physical-to-Digital Micro-Commerce Engine",
  description:
    "Instant physical storefront and inventory digitization with Meta SAM 3.1, Muse Spark 1.3, and Muse Code. Built for the Meta Global AI Developer Hackathon.",
  keywords: [
    "OmniStore AI",
    "SAM 3.1",
    "Muse Spark",
    "Muse Code",
    "Micro-Commerce",
    "Meta Global AI Hackathon",
    "Build for Your World",
    "Lagos Market",
    "African Commerce",
  ],
  authors: [{ name: "Joseph John Bassey" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#080a0f] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black font-sans">
        {children}
      </body>
    </html>
  );
}
