import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

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
  openGraph: {
    title: "OmniStore AI — Physical-to-Digital Micro-Commerce Engine",
    description:
      "Instant physical storefront and inventory digitization with Meta SAM 3.1, Muse Spark 1.3, and Muse Code.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OmniStore AI",
    description: "Turn any market stall into an online store in seconds.",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#08090a] text-[#f7f8f8] antialiased selection:bg-[#10b981] selection:text-[#06110d] font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
