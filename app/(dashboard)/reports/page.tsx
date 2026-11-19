"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Users,
  CreditCard,
  FileCheck2,
  HeartHandshake,
  ShieldAlert,
  Scale,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";

export default function ReportsPage() {
  const { hasPermission } = useAuth();
  const { notify } = useNotification();

  const [activeReport, setActiveReport] = useState("advocates");
  const [downloading, setDownloading] = useState(false);

  const reportCards = [
    {
      id: "advocates",
      title: "Advocates Directory & Roll",
      description: "Complete list of advocates, state bar registration numbers, membership status, and welfare enrolment.",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      id: "dues",
      title: "Membership Dues & Arrears",
      description: "Yearly dues, monthly chanda tracking, outstanding balances, and advocate collection ledgers.",
      icon: CreditCard,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      id: "sales",
      title: "Waqalatnama & Form Sales",
      description: "Counter sales register, items sold, unit prices, discounts, and counter cash/UPI receipts.",
      icon: FileCheck2,
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      id: "finance",
      title: "Income & Expense Audit Statement",
      description: "Comprehensive financial statement comparing all operational revenues against expense vouchers.",
      icon: Scale,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/40",
    },
    {
      id: "claims",
      title: "Welfare Claims & Disbursements",
      description: "Death benefit relief and health claims workflow, committee sanctioned amounts, and bank UTRs.",
      icon: ShieldAlert,
      color: "text-rose-500",
      bgColor: "bg-rose-50 dark:bg-rose-950/40",
    },
    {
      id: "donations",
      title: "Voluntary Donations & Corpus",
      description: "Contributor directory, PAN details, donation categories, and welfare endowment fund summaries.",
      icon: HeartHandshake,
      color: "text-sky-500",
      bgColor: "bg-sky-50 dark:bg-sky-950/40",
    },
  ];

  const handleExport = (reportType: string, format: "xlsx" | "csv") => {
    setDownloading(true);
    notify.info(`Generating ${format.toUpperCase()} report...`);
    const url = `/api/reports/export?type=${reportType}&format=${format}`;
    window.open(url, "_blank");
    setTimeout(() => setDownloading(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-gold-500" />
            MIS & Management Audit Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Export comprehensive regulatory audits, financial statements, and membership rolls to Excel (.xlsx) and CSV.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          icon={<Printer className="w-4 h-4" />}
          className="no-print"
        >
          Print Current View
        </Button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportCards.map((r) => {
          const Icon = r.icon;
          return (
            <Card
              key={r.id}
              className={`p-5 flex flex-col justify-between hover:shadow-md transition-all ${
                activeReport === r.id ? "ring-2 ring-gold-500/50" : ""
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${r.bgColor} ${r.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="neutral" size="sm">
                    MIS Report
                  </Badge>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {r.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {r.description}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleExport(r.id, "xlsx")}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors"
                    title="Export as Microsoft Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={() => handleExport(r.id, "csv")}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-700 transition-colors"
                    title="Export as Comma Separated (.csv)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveReport(r.id)}
                  className="text-xs text-amber-600 dark:text-gold-400 hover:underline font-semibold"
                >
                  View Notes
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Report Description & Guidelines */}
      <Card>
        <CardHeader
          title="Reporting Compliance & Regulatory Standards"
          subtitle="Instructions for Bar Council auditing and general body presentation"
        />
        <CardContent className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            • <strong>Advocate Roll:</strong> Complies with State Bar Council annual verification standards. Includes registration numbers, enrolment dates, Kalyan Nidhi scheme IDs, and active/inactive validity status.
          </p>
          <p>
            • <strong>Dues & Collections:</strong> Categorizes membership fees by fiscal cycles. Shows partial payments, cleared accounts, and overdue arrears for active recovery.
          </p>
          <p>
            • <strong>Waqalatnama & Form Inventories:</strong> Tracks daily counter disbursements and verifies physical inventory matches the stock movement ledger with atomic transaction logging.
          </p>
          <p>
            • <strong>Audit Ledger:</strong> Links every approved Death Benefit Fund and Medical Aid disbursement directly with an official bank reference number (UTR / Cheque) for external statutory audit.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
