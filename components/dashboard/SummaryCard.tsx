import React from "react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: "navy" | "gold" | "emerald" | "rose" | "purple" | "blue";
  trend?: string;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  variant = "navy",
  trend,
}: SummaryCardProps) {
  const variantStyles = {
    navy: "border-slate-200/90 dark:border-navy-800 bg-white dark:bg-navy-900/90 shadow-sm hover:border-navy-400 dark:hover:border-navy-600",
    gold: "border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20 dark:from-navy-900 dark:via-navy-900 dark:to-amber-950/30 shadow-sm hover:border-gold-400",
    emerald: "border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/20 dark:from-navy-900 dark:via-navy-900 dark:to-emerald-950/30 shadow-sm hover:border-emerald-400",
    rose: "border-rose-200/80 dark:border-rose-900/50 bg-gradient-to-br from-white via-rose-50/30 to-rose-100/20 dark:from-navy-900 dark:via-navy-900 dark:to-rose-950/30 shadow-sm hover:border-rose-400",
    purple: "border-purple-200/80 dark:border-purple-900/50 bg-gradient-to-br from-white via-purple-50/30 to-purple-100/20 dark:from-navy-900 dark:via-navy-900 dark:to-purple-950/30 shadow-sm hover:border-purple-400",
    blue: "border-blue-200/80 dark:border-blue-900/50 bg-gradient-to-br from-white via-blue-50/30 to-blue-100/20 dark:from-navy-900 dark:via-navy-900 dark:to-blue-950/30 shadow-sm hover:border-blue-400",
  };

  const iconBgStyles = {
    navy: "bg-navy-100 text-navy-800 dark:bg-navy-800 dark:text-gold-400",
    gold: "bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-gold-400 ring-1 ring-amber-300/40 dark:ring-gold-500/30",
    emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-400 ring-1 ring-emerald-300/40 dark:ring-emerald-500/30",
    rose: "bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-400 ring-1 ring-rose-300/40 dark:ring-rose-500/30",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-950/90 dark:text-purple-400 ring-1 ring-purple-300/40 dark:ring-purple-500/30",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-950/90 dark:text-blue-400 ring-1 ring-blue-300/40 dark:ring-blue-500/30",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 sm:p-5 interactive-hover relative overflow-hidden group cursor-default",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
            {value}
          </h3>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 pt-0.5 font-medium truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn("p-2.5 sm:p-3 rounded-xl shrink-0 shadow-sm transition-transform group-hover:scale-110", iconBgStyles[variant])}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-navy-800/80 text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="truncate">{trend}</span>
        </div>
      )}
    </div>
  );
}
