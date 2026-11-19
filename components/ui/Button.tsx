import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, icon, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-5 py-2.5 gap-2.5",
    };

    const variantStyles = {
      primary: "bg-navy-800 hover:bg-navy-900 text-white shadow-sm focus:ring-navy-600 dark:bg-navy-700 dark:hover:bg-navy-600 border border-navy-700/50",
      secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-navy-900 dark:hover:bg-navy-800 dark:text-slate-200 focus:ring-slate-400 border border-slate-200 dark:border-navy-700",
      danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500",
      outline: "border border-slate-300 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-900 text-slate-700 dark:text-slate-200 focus:ring-navy-500",
      ghost: "hover:bg-slate-100 dark:hover:bg-navy-900 text-slate-600 dark:text-slate-300 focus:ring-slate-400",
      gold: "bg-gradient-to-r from-amber-500 to-gold-600 hover:from-amber-600 hover:to-gold-700 text-white font-semibold shadow-sm focus:ring-amber-400 border border-amber-400/30",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
