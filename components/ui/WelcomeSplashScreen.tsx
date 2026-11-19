"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Shield, Sparkles, Award, ArrowRight, X } from "lucide-react";

interface WelcomeSplashScreenProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export function WelcomeSplashScreen({ forceShow = false, onClose }: WelcomeSplashScreenProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if shown in this browser session
    const hasSeen = sessionStorage.getItem("has_seen_dba_splash_2025_2026");
    if (!hasSeen || forceShow) {
      setVisible(true);
      sessionStorage.setItem("has_seen_dba_splash_2025_2026", "true");
    }
  }, [forceShow]);

  useEffect(() => {
    if (!visible) return;

    const duration = 4000; // 4 seconds total
    const intervalTime = 40; // every 40ms
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => handleDismiss(), 400);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [visible]);

  const handleDismiss = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-navy-950/95 backdrop-blur-xl p-4 transition-all duration-500 animate-fadeIn overflow-y-auto">
      {/* Background ambient lighting effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-navy-950/80 to-navy-950 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Close button for impatient users */}
      <button
        onClick={handleDismiss}
        className="absolute top-5 right-5 p-2.5 rounded-full bg-navy-900/80 hover:bg-navy-800 text-slate-400 hover:text-white border border-navy-700/80 transition-all z-20 shadow-lg"
        title="Skip / Close Intro"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Glassmorphic Presidential Showcase Card */}
      <div className="relative w-full max-w-xl bg-gradient-to-b from-navy-900/95 via-navy-900/90 to-navy-950/95 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/20 backdrop-blur-2xl my-auto animate-scaleUp">
        {/* Top Gold Corner Accents */}
        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-gold-400 rounded-tl-3xl pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-gold-400 rounded-tr-3xl pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-gold-400 rounded-bl-3xl pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-gold-400 rounded-br-3xl pointer-events-none" />

        {/* Top Association Crest */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-gold-400/20 to-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-5 shadow-sm">
          <Award className="w-4 h-4 text-gold-400 shrink-0" />
          <span>जिला बार एसोसिएशन, जनपद बहराइच</span>
        </div>

        {/* President Portrait with Glowing Circular Frame */}
        <div className="relative mx-auto w-36 h-36 sm:w-44 sm:h-44 mb-5">
          {/* Animated pulsing outer halo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-gold-400 to-amber-600 blur-md opacity-60 animate-pulse" />
          
          <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-tr from-gold-400 via-amber-300 to-amber-600 shadow-2xl overflow-hidden border-2 border-amber-200">
            <img
              src="/president-rajesh-shukla.jpg"
              alt="Mr. Rajesh Shukla Advocate - President Jila Bar Association District Bahraich"
              className="w-full h-full object-cover object-top rounded-full"
            />
          </div>

          {/* President Official Gold Badge Seal */}
          <div className="absolute -bottom-2 inset-x-0 mx-auto w-max px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-600 via-gold-500 to-amber-600 text-navy-950 font-black text-[11px] uppercase tracking-wider shadow-md border border-amber-200 flex items-center gap-1">
            <Shield className="w-3 h-3 fill-navy-950" />
            <span>अध्यक्ष / PRESIDENT</span>
          </div>
        </div>

        {/* President Details */}
        <div className="space-y-1.5 mt-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide font-serif">
            Mr Rajesh Shukla Advocate
          </h1>
          <div className="text-sm sm:text-base font-bold text-amber-300 uppercase tracking-wider">
            PRESIDENT JILA BAR ASSOCIATION
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-300 tracking-wide">
            District Bahraich (Uttar Pradesh)
          </div>

          {/* Official Tenure Badge */}
          <div className="inline-block mt-2 px-4 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 font-extrabold text-xs sm:text-sm tracking-widest shadow-inner">
            ⚖️ TENURE: 2025 TO 2026
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-navy-700/80 relative">
          <div className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-navy-900 px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Official Digital Initiative</span>
          </div>
        </div>

        {/* Prominent Sponsorship Card */}
        <div className="bg-gradient-to-r from-amber-950/40 via-navy-800/80 to-amber-950/40 border border-amber-500/30 rounded-2xl p-4 shadow-lg text-center">
          <div className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mb-1">
            Proudly Sponsored By
          </div>
          <div className="text-sm sm:text-base font-black text-white tracking-wide text-amber-200">
            Meri Global Oil & Grease Mfg. And Trading India
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Committed to Quality & Supporting Advocates' Welfare and Digital Governance
          </p>
        </div>

        {/* Progress Bar & Loader Indicator */}
        <div className="mt-6 space-y-3">
          <div className="w-full bg-navy-950 rounded-full h-2.5 overflow-hidden border border-navy-700/80 p-0.5 shadow-inner">
            <div
              className="bg-gradient-to-r from-amber-500 via-gold-400 to-amber-500 h-full rounded-full transition-all duration-75 ease-out shadow-sm shadow-amber-400/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Loading Bar Council Portal...</span>
            <span className="font-mono text-gold-400 font-semibold">{Math.round(progress)}%</span>
          </div>

          {/* Enter Button */}
          <button
            onClick={handleDismiss}
            className="w-full mt-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-gold-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Enter Portal / पोर्टल में प्रवेश करें</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
