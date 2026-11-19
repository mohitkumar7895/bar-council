"use client";

import React from "react";
import Link from "next/link";
import {
  FileCheck2,
  FileText,
  Users,
  CreditCard,
  PlusCircle,
  Receipt,
  ShoppingCart,
  ShieldAlert,
  ClipboardList,
  RefreshCw,
  Box,
  Layers,
} from "lucide-react";
import { SummaryCard } from "./SummaryCard";
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

export function DataEntryDashboard({
  data,
  fetchStats,
  loading,
}: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Data Entry Terminal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-950 via-navy-950 to-amber-950 border border-gold-500/40 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Counter Sales & Office Intake Terminal
            </h2>
            <Badge variant="gold" size="sm">
              Staff Desk
            </Badge>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Waqalatnama & form sales counter, advocate registration terminal, and claim application intake.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            title="Refresh Stock"
            className="h-9 w-9 p-0 border-navy-700 text-white hover:bg-navy-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Counter Quick Action Terminal - Big Touch/Click Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/waqalatnama?action=sell" prefetch={true}>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md">
                <FileCheck2 className="w-6 h-6 text-white" />
              </div>
              <Badge variant="neutral" size="sm" className="bg-white/20 text-white border-white/30">
                POS Fast
              </Badge>
            </div>
            <h3 className="text-base font-black tracking-tight">Sell Waqalatnama</h3>
            <p className="text-xs text-amber-100 mt-0.5">Counter sale & instant receipt</p>
          </div>
        </Link>

        <Link href="/form-sales?action=sell" prefetch={true}>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <Badge variant="neutral" size="sm" className="bg-white/20 text-white border-white/30">
                Forms
              </Badge>
            </div>
            <h3 className="text-base font-black tracking-tight">Sell Form</h3>
            <p className="text-xs text-blue-100 mt-0.5">Membership, NOC & ID kit</p>
          </div>
        </Link>

        <Link href="/advocates?action=new" prefetch={true}>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <Badge variant="neutral" size="sm" className="bg-white/20 text-white border-white/30">
                Roll
              </Badge>
            </div>
            <h3 className="text-base font-black tracking-tight">Register Advocate</h3>
            <p className="text-xs text-emerald-100 mt-0.5">Bar registration & profile</p>
          </div>
        </Link>

        <Link href="/membership?action=collect" prefetch={true}>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <Badge variant="neutral" size="sm" className="bg-white/20 text-white border-white/30">
                Cashier
              </Badge>
            </div>
            <h3 className="text-base font-black tracking-tight">Collect Chanda</h3>
            <p className="text-xs text-purple-100 mt-0.5">Monthly dues receipt</p>
          </div>
        </Link>
      </div>

      {/* Operational Stock & Sales Focus Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Waqalatnama Stock Balance"
          value={`${data?.waqalatnama?.stockBalance ?? 0} Units`}
          subtitle="Available in Counter Godown"
          icon={<Box className="w-5 h-5" />}
          variant="gold"
          trend="Inventory Level"
        />

        <SummaryCard
          title="Total Waqalatnama Sold"
          value={formatCurrency(data?.waqalatnama?.totalSales ?? 0)}
          subtitle={`${data?.waqalatnama?.unitsSold ?? 0} Copies Issued`}
          icon={<FileCheck2 className="w-5 h-5" />}
          variant="emerald"
          trend="Counter Sales Volume"
        />

        <SummaryCard
          title="Application Forms Sold"
          value={formatCurrency(data?.formSales?.totalSales ?? 0)}
          subtitle={`${data?.formSales?.unitsSold ?? 0} Forms Issued`}
          icon={<FileText className="w-5 h-5" />}
          variant="blue"
          trend="NOC, Welfare & Admission"
        />

        <SummaryCard
          title="Advocates Registered"
          value={data?.advocates?.total ?? 0}
          subtitle={`${data?.advocates?.active ?? 0} Active Members`}
          icon={<Users className="w-5 h-5" />}
          variant="purple"
          trend="Association Roll"
        />
      </div>

      {/* Counter Transaction Feed */}
      <Card>
        <CardHeader
          title="Recent Counter Sales & Receipts"
          subtitle="Transactions issued at this counter terminal today"
        />
        <div className="table-wrapper overflow-x-auto" tabIndex={0} role="region">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950/60 border-y border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Receipt No</th>
                <th className="py-3 px-4 font-semibold">Buyer / Advocate</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Module</th>
                <th className="py-3 px-4 font-semibold">Mode</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
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
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
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
