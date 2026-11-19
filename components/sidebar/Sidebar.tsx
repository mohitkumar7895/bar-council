"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileCheck2,
  FileText,
  HeartHandshake,
  ShieldAlert,
  Stethoscope,
  FolderLock,
  Briefcase,
  Receipt,
  Scale,
  BarChart3,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface NavGroup {
  group: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
    ],
  },
  {
    group: "Advocates & Membership",
    items: [
      { label: "Advocates Directory", href: "/advocates", icon: Users, permission: "advocates:view" },
      { label: "Membership & Dues", href: "/membership", icon: CreditCard, permission: "membership:view" },
    ],
  },
  {
    group: "Sales & Donations",
    items: [
      { label: "Waqalatnama Stock & Sales", href: "/waqalatnama", icon: FileCheck2, permission: "waqalatnama:view" },
      { label: "Form Sales", href: "/form-sales", icon: FileText, permission: "form_sales:view" },
      { label: "Donations & Funds", href: "/donations", icon: HeartHandshake, permission: "donations:view" },
    ],
  },
  {
    group: "Welfare & Relief",
    items: [
      { label: "Death Benefit Fund", href: "/death-benefit", icon: ShieldAlert, permission: "death_benefit:view" },
      { label: "Health Claims", href: "/health-claims", icon: Stethoscope, permission: "health_claims:view" },
    ],
  },
  {
    group: "Legal & Records",
    items: [
      { label: "Documents Repository", href: "/documents", icon: FolderLock, permission: "documents:view" },
      { label: "Cases / Claims Register", href: "/cases", icon: Briefcase, permission: "cases:view" },
    ],
  },
  {
    group: "Accounting & Finance",
    items: [
      { label: "Payments Ledger", href: "/payments", icon: Receipt, permission: "finance:view" },
      { label: "Income & Expenses", href: "/income-expenses", icon: Scale, permission: "finance:view" },
      { label: "Reports & MIS", href: "/reports", icon: BarChart3, permission: "reports:view" },
    ],
  },
  {
    group: "Administration",
    items: [
      { label: "User Management", href: "/users", icon: UserCog, permission: "users:manage" },
      { label: "Master Settings", href: "/settings", icon: Settings, permission: "settings:manage" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebar();
  const { user, logout, hasPermission } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-navy-950 text-slate-200 border-r border-navy-800 transition-all duration-300 ease-in-out select-none",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-navy-800/80 bg-navy-900/60">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-gold-600 flex items-center justify-center text-navy-950 shadow-md shrink-0">
              <Building2 className="w-5 h-5 font-bold" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm tracking-wide text-white">
                  BAR ASSOCIATION
                </span>
                <span className="text-[10px] text-gold-400 font-medium tracking-wider">
                  MANAGEMENT SYSTEM
                </span>
              </div>
            )}
          </Link>

          {/* Desktop collapse button */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Card */}
        <div className={cn("p-3 border-b border-navy-800/60", isCollapsed && "text-center")}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-navy-900/80 border border-navy-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold-500 to-amber-300 text-navy-950 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-100 truncate">
                  {user?.name || "Loading..."}
                </span>
                <span className="text-[10px] text-amber-400 font-medium truncate">
                  {user?.roleName || "User"}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-tr from-gold-500 to-amber-300 text-navy-950 font-bold flex items-center justify-center text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {NAV_GROUPS.map((group, idx) => {
            // Filter group items by permissions
            const visibleItems = group.items.filter(
              (item) => !item.permission || hasPermission(item.permission)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {!isCollapsed && (
                  <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {group.group}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={closeMobile}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                        isActive
                          ? "bg-gradient-to-r from-navy-800 to-navy-700 text-white shadow-sm border-l-4 border-gold-500 font-semibold"
                          : "text-slate-300 hover:text-white hover:bg-navy-900/80"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-gold-400" : "text-slate-400 group-hover:text-slate-200"
                        )}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-navy-800/80 bg-navy-950">
          <button
            onClick={logout}
            title={isCollapsed ? "Sign Out" : undefined}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-white hover:bg-rose-950/40 transition-colors",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
