"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  ChevronDown,
  User,
  Shield,
  LogOut,
  Calendar,
  Sparkles,
  Award,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { WelcomeSplashScreen } from "@/components/ui/WelcomeSplashScreen";

export function Header() {
  const pathname = usePathname();
  const { toggleMobile } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { activePeriod } = useApp();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format breadcrumbs from pathname
  const pathParts = pathname.split("/").filter(Boolean);
  const breadcrumbText = pathParts.length > 0
    ? pathParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " ")).join(" / ")
    : "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-navy-800 transition-colors">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobile}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">
            Bar System
          </span>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
          <h1 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
            {breadcrumbText}
          </h1>
        </div>
      </div>

      {/* President Showcase Welcome Modal */}
      <WelcomeSplashScreen forceShow={showSplash} onClose={() => setShowSplash(false)} />

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* President & Sponsor Badge Button */}
        <button
          onClick={() => setShowSplash(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-50 to-amber-100/70 dark:from-navy-800 dark:to-navy-850 border border-amber-300/80 dark:border-amber-500/40 hover:border-amber-500 text-left transition-all shadow-sm group cursor-pointer"
          title="Click to view Presidential Welcome Showcase"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 shadow-sm">
            <img
              src="/president-rajesh-shukla.jpg"
              alt="President Rajesh Shukla"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="leading-tight">
            <div className="text-[11px] font-bold text-slate-800 dark:text-amber-200 group-hover:text-amber-600 dark:group-hover:text-amber-300 flex items-center gap-1.5">
              <span>Mr. Rajesh Shukla</span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-500 text-navy-950 uppercase tracking-wider">
                PRESIDENT
              </span>
            </div>
            <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate max-w-[210px]">
              Jila Bar Association District Bahraich
            </div>
          </div>
        </button>

        {/* Active Period Badge */}
        {activePeriod && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-gold-700/60 text-amber-800 dark:text-gold-400 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Cycle: {activePeriod.name}</span>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
        >
          {theme === "light" ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-gold-600 text-navy-950 font-bold flex items-center justify-center text-xs shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {user?.name || "Admin"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {user?.roleName || "Administrator"}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-xl py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-800">
                <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.name}</p>
                <p className="text-slate-500 dark:text-slate-400 truncate text-[11px]">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-gold-400">
                  <Shield className="w-3 h-3" />
                  <span>{user?.roleName}</span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
