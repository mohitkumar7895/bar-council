"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface IncomeExpenseChartProps {
  data: { month: string; income: number; expense: number }[];
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No income/expense records available yet
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-navy-700 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      {payload[0].payload.month}
                    </p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      Income: {formatCurrency(payload[0].value as number)}
                    </p>
                    <p className="font-bold text-rose-600 dark:text-rose-400">
                      Expense: {formatCurrency(payload[1]?.value as number)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
          />
          <Bar
            name="Income"
            dataKey="income"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
          <Bar
            name="Expense"
            dataKey="expense"
            fill="#f43f5e"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
