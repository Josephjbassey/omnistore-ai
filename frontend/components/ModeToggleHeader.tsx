"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Store, Smartphone, ArrowRight, LogOut, User } from "lucide-react";
import { BackendStatusModal } from "@/components/BackendStatusModal";
import { getHealth } from "@/lib/api";
import { OmniStoreLogo } from "./OmniStoreLogo";

export type ActiveTab = "demo" | "storefront";

interface ModeToggleHeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  backendConnected: boolean;
  inventoryCount: number;
}

export const ModeToggleHeader: React.FC<ModeToggleHeaderProps> = ({
  activeTab,
  onSelectTab,
  backendConnected,
  inventoryCount,
}) => {
  const [backendModalOpen, setBackendModalOpen] = useState<boolean>(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await getHealth();
      } catch {}
    };
    checkConnection();
  }, [backendConnected]);

  return (
    <>
      {/* Sole Primary Navigation Bar — Zero Stacking / Zero Duplicate Navbars */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#08090a]/95 backdrop-blur-xl shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Brand Identity with Interlocking "O" Logo */}
          <div className="flex items-center space-x-3 min-w-max">
            <OmniStoreLogo size={32} showText={true} />
          </div>

          {/* Central E-Commerce Viewport Tabs */}
          <div className="flex items-center bg-[#0f1419] p-1 rounded-xl border border-white/10 shadow-inner">
            <button
              onClick={() => onSelectTab("demo")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                activeTab === "demo"
                  ? "bg-[#c1793f] text-white shadow-sm font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Stall Studio</span>
            </button>

            <button
              onClick={() => onSelectTab("storefront")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                activeTab === "storefront"
                  ? "bg-[#c1793f] text-white shadow-sm font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Live Store</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-[#cab695] font-bold ml-1">
                {inventoryCount}
              </span>
            </button>
          </div>

          {/* Auth: Sign in / Create account / Sign out */}
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-white/5">
                <span className="flex h-3 w-3 rounded-full animate-pulse bg-slate-400" />
              </div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-[#161d26] border border-white/10 rounded-lg px-2.5 py-1">
                  <span className="w-2 h-2 rounded-full bg-[#c1793f]" />
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
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#0a0c0e] bg-[#c1793f] hover:bg-[#d68749] shadow-[0_0_20px_rgba(193,121,63,0.35)] transition-all active:scale-[0.98]"
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>Create account</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backend & API Status Modal */}
      <BackendStatusModal
        isOpen={backendModalOpen}
        onClose={() => setBackendModalOpen(false)}
        backendConnected={backendConnected}
      />
    </>
  );
};
