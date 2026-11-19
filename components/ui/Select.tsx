import React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "block w-full rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 disabled:bg-slate-100 dark:disabled:bg-navy-950 disabled:cursor-not-allowed",
            "bg-white dark:bg-navy-900/90 text-slate-900 dark:text-slate-100",
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-900/50"
              : "border-slate-300 dark:border-navy-700/80 focus:border-navy-600 dark:focus:border-gold-500 focus:ring-navy-100 dark:focus:ring-gold-500/20",
            "px-3.5 py-2",
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
