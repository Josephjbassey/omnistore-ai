"use client";

import Link from "next/link";
import { Store, Smartphone, Terminal, ArrowRight } from "lucide-react";

export function Header() {
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
            <Link
              href="/auth/login"
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-comfortable text-xs font-bold text-[#06110d] bg-[#10b981] hover:bg-[#34d399] shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all active:scale-95"
            >
              <ArrowRight className="w-3 h-3" />
              <span>Get Started</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
