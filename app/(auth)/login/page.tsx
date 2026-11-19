"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Award,
  Sparkles,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { WelcomeSplashScreen } from "@/components/ui/WelcomeSplashScreen";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSplashManual, setShowSplashManual] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Invalid credentials. Please verify your login details.");
    }
  };

  const setDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Interactive Presidential Welcome Splash Screen Loader */}
      <WelcomeSplashScreen
        forceShow={showSplashManual}
        onClose={() => setShowSplashManual(false)}
      />

      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl z-10 space-y-6">
        {/* Top Executive Presidential & Sponsor Showcase Banner */}
        <div className="bg-gradient-to-r from-navy-900/95 via-navy-850/95 to-navy-900/95 border-2 border-amber-500/35 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle gold badge corners */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: President Photo + Credentials */}
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-gold-400 via-amber-300 to-amber-600 shadow-xl overflow-hidden border-2 border-amber-200">
                  <img
                    src="/president-rajesh-shukla.jpg"
                    alt="Mr. Rajesh Shukla Advocate - President"
                    className="w-full h-full object-cover object-top rounded-full"
                  />
                </div>
                <div className="absolute -bottom-1.5 inset-x-0 mx-auto w-max px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-gold-500 text-navy-950 font-black text-[9px] uppercase tracking-wider shadow border border-amber-200">
                  PRESIDENT
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] font-semibold uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span>Jila Bar Association District Bahraich</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-wide">
                  Mr Rajesh Shukla Advocate
                </h2>
                <div className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wide">
                  PRESIDENT JILA BAR ASSOCIATION District Bahraich
                </div>
                <div className="inline-block mt-1 px-3 py-0.5 rounded-lg bg-navy-800/90 border border-amber-400/30 text-amber-200 font-extrabold text-[11px] tracking-wider">
                  ⚖️ TENURE: 2025 TO 2026
                </div>
              </div>
            </div>

            {/* Right: Prominent Official Sponsor Badge */}
            <div className="w-full md:w-auto shrink-0 bg-gradient-to-br from-amber-950/40 via-navy-800/90 to-amber-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 text-center md:text-right shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center justify-center md:justify-end gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-gold-400" />
                <span>Sponsored By</span>
              </div>
              <div className="text-sm sm:text-base font-black text-amber-200 tracking-wide max-w-xs">
                Global Oil & Grease Mfg. And Trading India
              </div>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                Supporting Bar Council Governance & Advocates' Welfare
              </p>
              <button
                type="button"
                onClick={() => setShowSplashManual(true)}
                className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 hover:text-white transition-colors"
              >
                <span>View Introduction Loader</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Dual Grid: Brand Summary + Secure Login Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Association Info */}
          <div className="md:col-span-5 bg-navy-900/80 border border-navy-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-gold-400 flex items-center justify-center text-navy-950 shadow-lg shadow-amber-500/10 border border-amber-300/40 shrink-0">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-wide">
                  DISTRICT BAR ASSOCIATION
                </h1>
                <p className="text-[11px] uppercase tracking-wider text-gold-400 font-bold">
                  District Bahraich, Uttar Pradesh
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-navy-800 pt-4">
              <p>
                Welcome to the unified judicial administration and advocate management system of Jila Bar Association Bahraich.
              </p>
              <ul className="space-y-2 text-[11px] text-slate-400">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Advocate Directory & Roll of Practice</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Waqalatnama & Legal Forms Counter POS</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Advocate Welfare, Health & Death Benefit Funds</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Transparent Accounts & MIS Reports</span>
                </li>
              </ul>
            </div>

            {/* Quick-fill Demo Accounts for Examination & Testing */}
            <div className="pt-4 border-t border-navy-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
                Quick Role Credentials
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDemoAccount("admin@districtbar.org.in", "Admin@12345")}
                  className="p-2 rounded-lg bg-navy-800/80 hover:bg-navy-700 border border-navy-700 text-slate-300 hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="font-semibold text-amber-400">Super Admin</div>
                  <div className="text-[10px] text-slate-400 truncate">Executive Control</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoAccount("secretary@districtbar.org.in", "Secretary@123")}
                  className="p-2 rounded-lg bg-navy-800/80 hover:bg-navy-700 border border-navy-700 text-slate-300 hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="font-semibold text-sky-400">Secretary</div>
                  <div className="text-[10px] text-slate-400 truncate">Advocates & Claims</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoAccount("accounts@districtbar.org.in", "Accounts@123")}
                  className="p-2 rounded-lg bg-navy-800/80 hover:bg-navy-700 border border-navy-700 text-slate-300 hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="font-semibold text-emerald-400">Accounts</div>
                  <div className="text-[10px] text-slate-400 truncate">Finance & Dues</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoAccount("staff@districtbar.org.in", "Staff@123")}
                  className="p-2 rounded-lg bg-navy-800/80 hover:bg-navy-700 border border-navy-700 text-slate-300 hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="font-semibold text-purple-400">Office Staff</div>
                  <div className="text-[10px] text-slate-400 truncate">Counter POS Sales</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Login Box */}
          <div className="md:col-span-7 bg-navy-900/90 border border-navy-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Sign In to Association</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your authorized credentials to access your role-specific dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Official Email Address"
                type="email"
                placeholder="e.g. admin@districtbar.org.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leadingIcon={<Mail className="w-4 h-4" />}
                required
                className="bg-navy-950/80 border-navy-700 text-white placeholder:text-slate-500"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leadingIcon={<Lock className="w-4 h-4" />}
                required
                className="bg-navy-950/80 border-navy-700 text-white placeholder:text-slate-500"
              />

              <Button
                type="submit"
                variant="gold"
                size="lg"
                loading={loading}
                className="w-full mt-2 cursor-pointer"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to System
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-navy-800 text-center">
              <p className="text-[11px] text-slate-400">
                Jila Bar Association District Bahraich • Tenure 2025-2026
              </p>
              <p className="text-[10px] text-amber-400/80 mt-0.5 font-medium">
                Sponsored By Global Oil & Grease Mfg. And Trading India
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-500">
          Protected by Enterprise-grade AES & Role-Based Access Control • © 2026 Bar Council
        </p>
      </div>
    </div>
  );
}
