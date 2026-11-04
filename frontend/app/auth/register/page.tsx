"use client";

import { useState } from "react";
import { register } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Store } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("merchant");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { register: authRegister } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authRegister(email, password, fullName, role);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg">
              <Store className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white tracking-tight">OmniStore AI</h1>
              <p className="text-sm text-slate-400">Create your merchant account</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 text-center">
            Publish stores, manage inventory, and track your digital storefronts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-[#0e121a]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="fullName"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl text-slate-200 bg-[#080a0f]/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                placeholder="Chidi Market Vendor"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl text-slate-200 bg-[#080a0f]/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                placeholder="you@market.example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl text-slate-200 bg-[#080a0f]/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Account Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-3 pr-3 py-2.5 border border-white/10 rounded-xl text-slate-200 bg-[#080a0f]/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
              >
                <option value="merchant">Market Vendor / Merchant</option>
                <option value="customer">Customer / Buyer</option>
              </select>
            </div>
            {error && (
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-xs text-red-300">{error}</span>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold rounded-xl text-sm shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>Create account</span>
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
