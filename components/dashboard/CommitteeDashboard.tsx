"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  HeartHandshake,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  Info,
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

export function CommitteeDashboard({
  data,
  period,
  setPeriod,
  fetchStats,
  loading,
}: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Committee Notice Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 flex items-start gap-3 shadow-sm">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-sm text-indigo-900 dark:text-indigo-100">
            Executive Committee Inspection Portal (Read-Only)
          </p>
          <p className="text-slate-600 dark:text-slate-400 mt-0.5">
            You are signed in with executive supervisory permissions. You can inspect member rolls, financial statements, and welfare distributions. Modification and deletion functions are restricted.
          </p>
        </div>
      </div>

      {/* Committee Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-navy-900 to-indigo-950 border border-indigo-500/30 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Executive Committee Inspection Console
            </h2>
            <Badge variant="neutral" size="sm" className="bg-indigo-500/20 text-indigo-200 border-indigo-400/40">
              Committee Review
            </Badge>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            General overview of association welfare corpus, membership strength, and audited financial statements.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/reports" prefetch={true}>
            <Button variant="gold" size="sm" icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
              Download Audit Reports
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            title="Refresh"
            className="h-9 w-9 p-0 border-navy-700 text-white hover:bg-navy-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Committee Oversight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Association Enrolment"
          value={data?.advocates?.total ?? 0}
          subtitle={`${data?.advocates?.active ?? 0} Active Practicing Members`}
          icon={<Users className="w-5 h-5" />}
          variant="navy"
          trend="Bar Council Roll"
        />

        <SummaryCard
          title="Welfare Relief Disbursed"
          value={formatCurrency((data?.deathClaims?.disbursedAmount ?? 0) + (data?.healthClaims?.disbursedAmount ?? 0))}
          subtitle={`${(data?.deathClaims?.disbursed ?? 0) + (data?.healthClaims?.disbursed ?? 0)} Cases Supported`}
          icon={<HeartHandshake className="w-5 h-5" />}
          variant="purple"
          trend="Apda & Kalyan Kosh Sanctioned"
        />

        <SummaryCard
          title="Total Fees Collected"
          value={formatCurrency(data?.dues?.collected ?? 0)}
          subtitle={`Outstanding: ${formatCurrency(data?.dues?.outstanding ?? 0)}`}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="emerald"
          trend="Membership Collection Health"
        />

        <SummaryCard
          title="Operating Surplus Reserves"
          value={formatCurrency(data?.finance?.netBalance ?? 0)}
          subtitle={`Revenue: ${formatCurrency(data?.finance?.income ?? 0)}`}
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="gold"
          trend="Association Net Balance"
        />
      </div>

      {/* Financial Health Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Revenue Collections Trend"
            subtitle="Monthly membership dues and subscriptions"
          />
          <CardContent>
            <CollectionChart data={data?.charts?.monthlyCollections || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Income vs Expenses (Audited Overview)"
            subtitle="Association operating inflows vs expenditures"
          />
          <CardContent>
            <IncomeExpenseChart data={data?.charts?.incomeExpenseTrend || []} />
          </CardContent>
        </Card>
      </div>

      {/* Pending Applications Review for Committee Meeting */}
      <Card>
        <CardHeader
          title="Pending Welfare Applications for Committee Review"
          subtitle="Death Benefit & Medical aid cases scheduled for scrutiny"
        />
        <div className="table-wrapper overflow-x-auto" tabIndex={0} role="region">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950/60 border-y border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Claim Type</th>
                <th className="py-3 px-4 font-semibold">Claim No</th>
                <th className="py-3 px-4 font-semibold">Advocate / Beneficiary</th>
                <th className="py-3 px-4 font-semibold">Filing Date</th>
                <th className="py-3 px-4 font-semibold text-right">Requested Relief</th>
                <th className="py-3 px-4 font-semibold">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {data?.pendingClaims?.length > 0 ? (
                data.pendingClaims.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{c.claim_type}</td>
                    <td className="py-3 px-4 font-mono text-amber-600 dark:text-gold-400">{c.claim_no}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{c.subject_name}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(c.date)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(c.requested_amount)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="warning" size="sm">{c.status?.replace(/_/g, " ")}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No pending applications requiring committee action.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
