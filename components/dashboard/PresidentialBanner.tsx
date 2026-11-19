"use client";

import React from "react";
import { Award, Sparkles, Shield, ChevronRight } from "lucide-react";

export function PresidentialBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border-2 border-amber-500/30 p-4 sm:p-5 shadow-lg shadow-amber-500/5 mb-6">
      {/* Background radial glow */}
      <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 top-0 w-40 h-40 bg-gold-400/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: President Photo and Credentials */}
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-gold-400 via-amber-300 to-amber-600 shadow-md overflow-hidden border-2 border-amber-300">
              <img
                src="/president-rajesh-shukla.jpg"
                alt="Mr. Rajesh Shukla Advocate - President"
                className="w-full h-full object-cover object-top rounded-full"
              />
            </div>
            <div className="absolute -bottom-1 inset-x-0 mx-auto w-max px-2 py-0.2 rounded-full bg-gradient-to-r from-amber-600 to-gold-500 text-navy-950 font-black text-[8px] uppercase tracking-wider shadow">
              PRESIDENT
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-semibold uppercase tracking-wider">
              <Award className="w-3 h-3 text-gold-400" />
              <span>Jila Bar Association District Bahraich</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-wide font-serif">
              Mr Rajesh Shukla Advocate
            </h2>
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              PRESIDENT JILA BAR ASSOCIATION District Bahraich
            </div>
            <div className="inline-block text-[11px] font-extrabold text-amber-200/90 tracking-wider">
              ⚖️ TENURE: 2025 TO 2026
            </div>
          </div>
        </div>

        {/* Right: Sponsor Section */}
        <div className="shrink-0 text-center md:text-right bg-navy-950/60 border border-amber-500/20 rounded-xl px-4 py-2.5 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center justify-center md:justify-end gap-1 mb-0.5">
            <Sparkles className="w-3 h-3 text-gold-400" />
            <span>Sponsored By</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-amber-200 tracking-wide">
            Meri Global Oil & Grease Mfg. And Trading India
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Supporting Advocates' Governance & Legal Welfare
          </div>
        </div>
      </div>
    </div>
  );
}
