"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Store, Smartphone, Terminal, ArrowRight, LogOut, User, ShieldCheck } from "lucide-react";

export function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0f172a]/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2.5"
            aria-label="OmniStore AI home"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <Store className="w-5 h-5 text-[#064e3b]" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white uppercase">
              OmniStore<span className="text-emerald-400"> AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-slate-300">
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
            <Link
              href="/"
              className="flex items-center space-x-1.5 hover:text-white transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Judge Mode</span>
            </Link>
          </nav>

          {isLoading ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-white/5">
              <span className="flex h-3 w-3 rounded-full animate-pulse bg-slate-400" />
            </div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-slate-200">{user.full_name}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  window.location.assign("/");
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 border border-white/10 hover:bg-white/5 hover:text-white transition-colors active:scale-[0.98]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/auth/login"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-white/5 hover:bg-white/5 hover:text-white transition-colors active:scale-[0.98]"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign in</span>
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#064e3b] bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all active:scale-[0.98]"
              >
                <ArrowRight className="w-3 h-3" />
                <span>Create account</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
