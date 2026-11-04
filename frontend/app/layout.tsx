import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Link from "next/link";
import { Store, Smartphone, Terminal, ArrowRight } from "lucide-react";

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
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#08090a] text-[#f7f8f8] antialiased selection:bg-[#10b981] selection:text-[#06110d] font-sans">
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#08090a]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2.5"
            aria-label="OmniStore AI home"
          >
            <div className="logomark" aria-hidden="true">
              <Store className="w-5 h-5 text-[#06110d]" />
            </div>
            <span className="font-semibold text-xs tracking-tight text-white uppercase">
              OmniStore<span className="text-[#10b981]"> AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-slate-300">
            <Link
              href="/"
              className="flex items-center space-x-1.5 hover:text-white transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Store Owner</span>
            </Link>
            <Link
              href="/"
              className="flex items-center space-x-1.5 hover:text-white transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Meta AI Mode</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/auth/login"
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-comfortable text-xs font-medium text-slate-300 border border-white/5 hover:bg-white/5 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <button
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-comfortable text-xs font-bold text-[#06110d] bg-[#10b981] hover:bg-[#34d399] shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all active:scale-95"
              onClick={() => window.location.assign("/auth/login")}
            >
              <ArrowRight className="w-3 h-3" />
              <span>Get Started</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
