"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  FileCheck2,
  HeartHandshake,
  ShieldAlert,
  Stethoscope,
  TrendingUp,
  Scale,
  Settings,
  UserCog,
  RefreshCw,
  PlusCircle,
  FileText,
  Activity,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { CollectionChart } from "@/components/charts/CollectionChart";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

interface DashboardProps {
  data: any;
  period: string;
  setPeriod: (p: any) => void;
  fetchStats: () => void;
  loading: boolean;
}

export function SuperAdminDashboard({
  data,
  period,
  setPeriod,
  fetchStats,
  loading,
}: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Super Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border border-gold-500/30 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Super Admin Executive Console
            </h2>
            <Badge variant="gold" size="sm">
              Root Authority
            </Badge>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Complete Bar Association governance, system health, revenue oversight, and security management.
          </p>
        </div>

        {/* Date Filter Tabs & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-1 rounded-xl bg-navy-900/90 border border-navy-700 text-xs">
            {["today", "month", "year", "all"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                  period === p
                    ? "bg-gold-500 text-navy-950 shadow-sm font-bold"
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
            title="Refresh Metrics"
            className="h-9 w-9 p-0 border-navy-700 text-white hover:bg-navy-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* System Admin Quick Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Link href="/users" prefetch={true}>
          <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-gold-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <UserCog className="w-5 h-5 mx-auto mb-1 text-gold-500 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Manage Users</p>
            <p className="text-[10px] text-slate-400">Roles & Staff</p>
          </div>
        </Link>

        <Link href="/settings" prefetch={true}>
          <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-gold-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <Settings className="w-5 h-5 mx-auto mb-1 text-blue-500 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Master Settings</p>
            <p className="text-[10px] text-slate-400">Rules & Cycles</p>
          </div>
        </Link>

        <Link href="/advocates?action=new" prefetch={true}>
          <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-gold-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <PlusCircle className="w-5 h-5 mx-auto mb-1 text-emerald-500 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">New Advocate</p>
            <p className="text-[10px] text-slate-400">Enrol Member</p>
          </div>
        </Link>

        <Link href="/membership?action=collect" prefetch={true}>
          <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-gold-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <CreditCard className="w-5 h-5 mx-auto mb-1 text-amber-500 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Collect Dues</p>
            <p className="text-[10px] text-slate-400">Chanda & Fees</p>
          </div>
        </Link>

        <Link href="/income-expenses?action=expense" prefetch={true}>
          <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-gold-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <Scale className="w-5 h-5 mx-auto mb-1 text-rose-500 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Post Expense</p>
            <p className="text-[10px] text-slate-400">Voucher Entry</p>
          </div>
        </Link>

        <Link href="/reports" prefetch={true}>
          <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-gold-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <Layers className="w-5 h-5 mx-auto mb-1 text-purple-500 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Audit Reports</p>
            <p className="text-[10px] text-slate-400">Excel & CSV</p>
          </div>
        </Link>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Registered Advocates"
          value={data?.advocates?.total ?? 0}
          subtitle={`${data?.advocates?.active ?? 0} Active • ${data?.advocates?.inactive ?? 0} Inactive`}
          icon={<Users className="w-5 h-5" />}
          variant="navy"
          trend="Bar Council Member Directory"
        />

        <SummaryCard
          title="Total Fees & Chanda Collected"
          value={formatCurrency(data?.dues?.collected ?? 0)}
          subtitle={`Arrears / Due: ${formatCurrency(data?.dues?.outstanding ?? 0)}`}
          icon={<CreditCard className="w-5 h-5" />}
          variant="emerald"
          trend="Membership Collection Roll"
        />

        <SummaryCard
          title="Total Association Inflows"
          value={formatCurrency(data?.finance?.income ?? 0)}
          subtitle={`Net Surplus: ${formatCurrency(data?.finance?.netBalance ?? 0)}`}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="gold"
          trend="All Audited Revenues"
        />

        <SummaryCard
          title="Total Association Outflows"
          value={formatCurrency(data?.finance?.expenses ?? 0)}
          subtitle={`Claims Disbursed: ${formatCurrency(data?.finance?.disbursements ?? 0)}`}
          icon={<Scale className="w-5 h-5" />}
          variant="rose"
          trend="Expenses & Welfare Relief"
        />
      </div>

      {/* Secondary Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Waqalatnama Sales"
          value={formatCurrency(data?.waqalatnama?.totalSales ?? 0)}
          subtitle={`Available Stock: ${data?.waqalatnama?.stockBalance ?? 0} Units`}
          icon={<FileCheck2 className="w-5 h-5" />}
          variant="gold"
          trend={`${data?.waqalatnama?.unitsSold ?? 0} Forms Sold to Date`}
        />

        <SummaryCard
          title="Form Sales & Stock"
          value={formatCurrency(data?.formSales?.totalSales ?? 0)}
          subtitle={`${data?.formSales?.unitsSold ?? 0} Counter Forms Sold`}
          icon={<FileText className="w-5 h-5" />}
          variant="blue"
          trend="Application & NOC Kits"
        />

        <SummaryCard
          title="Death Benefit Claims"
          value={data?.deathClaims?.pending ?? 0}
          subtitle={`${data?.deathClaims?.approved ?? 0} Approved • ${data?.deathClaims?.disbursed ?? 0} Disbursed`}
          icon={<ShieldAlert className="w-5 h-5" />}
          variant="rose"
          trend={`Sanctioned: ${formatCurrency(data?.deathClaims?.disbursedAmount ?? 0)}`}
        />

        <SummaryCard
          title="Health Relief Claims"
          value={data?.healthClaims?.pending ?? 0}
          subtitle={`${data?.healthClaims?.approved ?? 0} Approved • ${data?.healthClaims?.disbursed ?? 0} Disbursed`}
          icon={<Stethoscope className="w-5 h-5" />}
          variant="purple"
          trend={`Sanctioned: ${formatCurrency(data?.healthClaims?.disbursedAmount ?? 0)}`}
        />
      </div>

      {/* Analytics Charts */}
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
            title="Income vs Expenses Audit Curve"
            subtitle="Monthly comparison of association revenue against operational outflows"
          />
          <CardContent>
            <IncomeExpenseChart data={data?.charts?.incomeExpenseTrend || []} />
          </CardContent>
        </Card>
      </div>

      {/* System Audit Trail & Latest Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Activity Logs */}
        <Card>
          <CardHeader
            title="System Security & Audit Trail"
            subtitle="Real-time log of administrative logins and data mutations"
          />
          <div className="p-4 space-y-3">
            {data?.recentActivities?.length > 0 ? (
              data.recentActivities.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800 text-xs flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{act.action}</span>
                      <Badge variant="neutral" size="sm">{act.module}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{act.details}</p>
                    <span className="text-[10px] text-gold-600 dark:text-gold-400 font-semibold">
                      By: {act.user_name || "System"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {formatDateTime(act.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No recent audit logs</p>
            )}
          </div>
        </Card>

        {/* Recent Financial Receipts */}
        <Card>
          <CardHeader
            title="Recent Association Collections"
            subtitle="Latest cash and digital payments received across all modules"
            action={
              <Link href="/payments" prefetch={true}>
                <Button variant="ghost" size="sm" icon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                  Ledger
                </Button>
              </Link>
            }
          />
          <div className="table-wrapper overflow-x-auto" tabIndex={0} role="region">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/60 border-y border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Receipt</th>
                  <th className="py-2.5 px-3 font-semibold">Advocate / Payer</th>
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {data?.recentPayments?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-gold-600 dark:text-gold-400">
                      {p.receipt_no}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                      {p.advocate_name || p.payer_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{formatDate(p.payment_date)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
