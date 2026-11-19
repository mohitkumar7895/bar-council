"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 p-4 relative overflow-hidden">
      {/* Decorative background grid and ambient circles */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-gold-400 mx-auto flex items-center justify-center text-navy-950 shadow-xl shadow-amber-500/10 border border-amber-300/40">
            <Building2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">
            BAR ASSOCIATION
          </h1>
          <p className="text-xs uppercase tracking-widest text-gold-400 font-semibold">
            Management & Governance Portal
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-navy-900/90 border border-navy-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Sign In to Association</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to access the administrative dashboard.
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
              className="w-full mt-2"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to System
            </Button>
          </form>

          {/* Quick-fill Demo Accounts for Examination & Testing */}
          <div className="mt-8 pt-6 border-t border-navy-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
              Quick Role Switcher (Demo Credentials)
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setDemoAccount("admin@districtbar.org.in", "Admin@12345")}
                className="p-2 rounded-lg bg-navy-800/80 hover:bg-navy-700 border border-navy-700 text-slate-300 hover:text-white transition-all text-left"
              >
                <div className="font-semibold text-amber-400">Super Admin</div>
                <div className="text-[10px] text-slate-400 truncate">Full System Control</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount("secretary@districtbar.org.in", "Secretary@123")}
                className="p-2 rounded-lg bg-navy-800/80 hover:bg-navy-700 border border-navy-700 text-slate-300 hover:text-white transition-all text-left"
              >
                <div className="font-semibold text-sky-400">Secretary</div>
                <div className="text-[10px] text-slate-400 truncate">Advocates & Claims</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount("accounts@districtbar.org.in", "Accounts@123")}
                className="p-2 rounded-lg bg-navy-800/80 hover:bg-navy-700 border border-navy-700 text-slate-300 hover:text-white transition-all text-left"
              >
                <div className="font-semibold text-emerald-400">Accounts</div>
                <div className="text-[10px] text-slate-400 truncate">Finance & Dues</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount("staff@districtbar.org.in", "Staff@123")}
                className="p-2 rounded-lg bg-navy-800/80 hover:bg-navy-700 border border-navy-700 text-slate-300 hover:text-white transition-all text-left"
              >
                <div className="font-semibold text-purple-400">Office Staff</div>
                <div className="text-[10px] text-slate-400 truncate">Data Entry & Sales</div>
              </button>
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
