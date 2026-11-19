"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  ShieldAlert,
  Stethoscope,
  Briefcase,
  FileCheck2,
  FileText,
  UserCheck,
  AlertCircle,
  PlusCircle,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
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

export function SecretaryDashboard({
  data,
  period,
  setPeriod,
  fetchStats,
  loading,
}: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Secretary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 border border-emerald-500/30 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Secretariat Executive Console
            </h2>
            <Badge variant="success" size="sm">
              Secretary Secretariat
            </Badge>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Advocate membership rolls, committee welfare claims scrutiny, grievance hearings, and operations oversight.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            title="Refresh Records"
            className="h-9 w-9 p-0 border-navy-700 text-white hover:bg-navy-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Secretariat Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/advocates?action=new" prefetch={true}>
          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-emerald-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <PlusCircle className="w-5 h-5 mx-auto mb-1 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Enrol New Advocate</p>
            <p className="text-[10px] text-slate-400">Bar Roll Registration</p>
          </div>
        </Link>

        <Link href="/death-benefit" prefetch={true}>
          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-rose-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <ShieldAlert className="w-5 h-5 mx-auto mb-1 text-rose-500 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Review Death Claims</p>
            <p className="text-[10px] text-slate-400">Committee Scrutiny</p>
          </div>
        </Link>

        <Link href="/health-claims" prefetch={true}>
          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-purple-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <Stethoscope className="w-5 h-5 mx-auto mb-1 text-purple-500 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Review Health Aid</p>
            <p className="text-[10px] text-slate-400">Medical Approvals</p>
          </div>
        </Link>

        <Link href="/cases" prefetch={true}>
          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-gold-500 transition-all shadow-sm hover:shadow group cursor-pointer text-center">
            <Briefcase className="w-5 h-5 mx-auto mb-1 text-gold-500 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Grievance & Cases</p>
            <p className="text-[10px] text-slate-400">Hearing Register</p>
          </div>
        </Link>
      </div>

      {/* Secretariat Focus Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Active Member Advocates"
          value={data?.advocates?.active ?? 0}
          subtitle={`Total Roll: ${data?.advocates?.total ?? 0} Enrolled Advocates`}
          icon={<UserCheck className="w-5 h-5" />}
          variant="emerald"
          trend="In Good Standing"
        />

        <SummaryCard
          title="Pending Welfare Applications"
          value={(data?.deathClaims?.pending ?? 0) + (data?.healthClaims?.pending ?? 0)}
          subtitle={`${data?.deathClaims?.pending ?? 0} Death • ${data?.healthClaims?.pending ?? 0} Health`}
          icon={<Clock className="w-5 h-5" />}
          variant="rose"
          trend="Awaiting Committee Scrutiny"
        />

        <SummaryCard
          title="Welfare Relief Sanctioned"
          value={formatCurrency((data?.deathClaims?.disbursedAmount ?? 0) + (data?.healthClaims?.disbursedAmount ?? 0))}
          subtitle="Total Disbursed Assistance"
          icon={<ShieldAlert className="w-5 h-5" />}
          variant="purple"
          trend="Apda & Kalyan Kosh Relief"
        />

        <SummaryCard
          title="Waqalatnama Inventory Status"
          value={`${data?.waqalatnama?.stockBalance ?? 0} Copies`}
          subtitle={`${data?.waqalatnama?.unitsSold ?? 0} Sold to Date`}
          icon={<FileCheck2 className="w-5 h-5" />}
          variant="gold"
          trend="Counter Stock Balance"
        />
      </div>

      {/* Action Table: Applications Requiring Secretary Scrutiny */}
      <Card>
        <CardHeader
          title="Priority Applications Requiring Secretariat Action"
          subtitle="Death benefits, medical assistance, and member appeals pending approval"
        />
        <div className="table-wrapper overflow-x-auto" tabIndex={0} role="region">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950/60 border-y border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Claim Type</th>
                <th className="py-3 px-4 font-semibold">Claim No</th>
                <th className="py-3 px-4 font-semibold">Beneficiary / Advocate</th>
                <th className="py-3 px-4 font-semibold">Application Date</th>
                <th className="py-3 px-4 font-semibold text-right">Requested Relief</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {data?.pendingClaims?.length > 0 ? (
                data.pendingClaims.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {c.claim_type}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                      {c.claim_no}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {c.subject_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(c.date)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(c.requested_amount)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="warning" size="sm">
                        {c.status?.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={c.claim_type === "Death Benefit" ? "/death-benefit" : "/health-claims"}
                        prefetch={true}
                      >
                        <Button variant="outline" size="sm">
                          Scrutinize
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No pending applications requiring attention. All claims are up to date!
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
