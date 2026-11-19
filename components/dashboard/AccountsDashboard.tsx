"use client";

import React from "react";
import Link from "next/link";
import {
  CreditCard,
  TrendingUp,
  Scale,
  Receipt,
  HeartHandshake,
  DollarSign,
  ArrowUpRight,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { CollectionChart } from "@/components/charts/CollectionChart";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardProps {
  data: any;
  period: string;
  setPeriod: (p: any) => void;
  fetchStats: () => void;
  loading: boolean;
}

export function AccountsDashboard({
  data,
  period,
  setPeriod,
  fetchStats,
  loading,
}: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Accounts & Finance Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-navy-900 to-emerald-950 border border-emerald-500/40 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Finance & Accounts Console
            </h2>
            <Badge variant="gold" size="sm">
              Accounts Desk
            </Badge>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Cash book management, subscription collections, voucher postings, bank disbursements, and audit trails.
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-1 rounded-xl bg-navy-900/90 border border-navy-700 text-xs">
            {["today", "month", "year", "all"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                  period === p
                    ? "bg-emerald-500 text-white shadow-sm font-bold"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {p === "year" ? "Financial Year" : p === "all" ? "All Time" : p}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            title="Refresh Ledger"
            className="h-9 w-9 p-0 border-navy-700 text-white hover:bg-navy-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Accounts Action Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/membership?action=collect" prefetch={true}>
          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-emerald-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <Receipt className="w-5 h-5 mx-auto mb-1 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Collect Dues / Chanda</p>
            <p className="text-[10px] text-slate-400">Issue Money Receipt</p>
          </div>
        </Link>

        <Link href="/income-expenses?action=expense" prefetch={true}>
          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-rose-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <Scale className="w-5 h-5 mx-auto mb-1 text-rose-500 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Post Expense Voucher</p>
            <p className="text-[10px] text-slate-400">Office & Vendor Outflow</p>
          </div>
        </Link>

        <Link href="/payments" prefetch={true}>
          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-amber-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <Wallet className="w-5 h-5 mx-auto mb-1 text-gold-500 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Payments Ledger</p>
            <p className="text-[10px] text-slate-400">Audit All Collections</p>
          </div>
        </Link>

        <Link href="/reports" prefetch={true}>
          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-purple-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <FileSpreadsheet className="w-5 h-5 mx-auto mb-1 text-purple-500 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Financial Reports</p>
            <p className="text-[10px] text-slate-400">Export Excel & CSV</p>
          </div>
        </Link>
      </div>

      {/* Financial Core Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Membership Dues Collected"
          value={formatCurrency(data?.dues?.collected ?? 0)}
          subtitle={`Arrears Outstanding: ${formatCurrency(data?.dues?.outstanding ?? 0)}`}
          icon={<CreditCard className="w-5 h-5" />}
          variant="emerald"
          trend="Subscription & Chanda Revenue"
        />

        <SummaryCard
          title="Total Revenue Inflows"
          value={formatCurrency(data?.finance?.income ?? 0)}
          subtitle="All Audited Receipts"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="gold"
          trend="Waqalatnama, Forms, Dues, Donations"
        />

        <SummaryCard
          title="Total Operational Expenses"
          value={formatCurrency(data?.finance?.expenses ?? 0)}
          subtitle="Office & Admin Vouchers"
          icon={<Scale className="w-5 h-5" />}
          variant="rose"
          trend="Vendor & Staff Remuneration"
        />

        <SummaryCard
          title="Net Operating Surplus / Reserves"
          value={formatCurrency(data?.finance?.netBalance ?? 0)}
          subtitle={`Disbursements: ${formatCurrency(data?.finance?.disbursements ?? 0)}`}
          icon={<DollarSign className="w-5 h-5" />}
          variant="emerald"
          trend="Audited Association Reserves"
        />
      </div>

      {/* Financial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Monthly Revenue Collections"
            subtitle="Subscription and chanda cash inflows over time"
          />
          <CardContent>
            <CollectionChart data={data?.charts?.monthlyCollections || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Income vs Expenses (Cash Flow Curve)"
            subtitle="Operational revenues compared against expenditures and welfare aid"
          />
          <CardContent>
            <IncomeExpenseChart data={data?.charts?.incomeExpenseTrend || []} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Payment Receipts Ledger */}
      <Card>
        <CardHeader
          title="Latest Payment Receipts & Cash Book Vouchers"
          subtitle="Recent transactions across membership dues, counter sales, and donations"
          action={
            <Link href="/payments" prefetch={true}>
              <Button variant="ghost" size="sm" icon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                View All Receipts
              </Button>
            </Link>
          }
        />
        <div className="table-wrapper overflow-x-auto" tabIndex={0} role="region">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950/60 border-y border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Receipt No</th>
                <th className="py-3 px-4 font-semibold">Payer / Advocate</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Source Module</th>
                <th className="py-3 px-4 font-semibold">Payment Mode</th>
                <th className="py-3 px-4 font-semibold text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {data?.recentPayments?.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                    {p.receipt_no}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {p.advocate_name || p.payer_name}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(p.payment_date)}</td>
                  <td className="py-3 px-4 capitalize">
                    <Badge variant="neutral" size="sm">{p.source_module?.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p.payment_mode}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
