"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Search,
  Filter,
  PlusCircle,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Printer,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { MONTHS } from "@/lib/constants";

export default function MembershipPage() {
  const { hasPermission } = useAuth();
  const { notify } = useNotification();

  const [dues, setDues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dueType, setDueType] = useState("all");
  const [periodId, setPeriodId] = useState("all");
  const [periods, setPeriods] = useState<any[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Collect Payment Modal
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [selectedAdvocateId, setSelectedAdvocateId] = useState("");
  const [advocatesList, setAdvocatesList] = useState<any[]>([]);
  const [collectAmount, setCollectAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Generated Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);

  // Batch Generation Modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [genPeriodId, setGenPeriodId] = useState("");
  const [genDueType, setGenDueType] = useState("monthly_chanda");
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [genAmount, setGenAmount] = useState(100);
  const [generating, setGenerating] = useState(false);

  // Fetch periods and advocates list
  useEffect(() => {
    fetch("/api/membership/periods")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPeriods(d.data);
      });

    fetch("/api/advocates?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAdvocatesList(d.data);
      });
  }, []);

  const fetchDues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search,
        status,
        dueType,
        periodId,
      });

      const res = await fetch(`/api/membership/dues?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDues(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalRecords(json.pagination.total);
      }
    } catch {
      notify.error("Failed to load membership dues");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status, dueType, periodId]);

  useEffect(() => {
    fetchDues();
  }, [fetchDues]);

  const handleOpenCollectModal = (advocateId?: number, suggestedAmount?: number) => {
    if (advocateId) {
      setSelectedAdvocateId(String(advocateId));
    } else {
      setSelectedAdvocateId(advocatesList[0]?.id ? String(advocatesList[0].id) : "");
    }
    setCollectAmount(suggestedAmount ? String(suggestedAmount) : "1200");
    setPaymentMode("UPI");
    setReferenceNo("");
    setNotes("Membership dues subscription");
    setCollectModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayment(true);

    try {
      const res = await fetch("/api/membership/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advocate_id: Number(selectedAdvocateId),
          amount: Number(collectAmount),
          payment_mode: paymentMode,
          reference_number: referenceNo,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Collection recording failed");
        return;
      }

      notify.success("Payment recorded successfully!");
      setCollectModalOpen(false);
      setCurrentReceipt(json.data);
      setReceiptModalOpen(true);
      fetchDues();
    } catch (err: any) {
      notify.error(err.message || "Failed to submit collection");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch("/api/membership/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period_id: Number(genPeriodId || periods[0]?.id),
          due_type: genDueType,
          month: genDueType === "monthly_chanda" ? Number(genMonth) : null,
          year: Number(genYear),
          amount: Number(genAmount),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Generation failed");
        return;
      }

      notify.success(json.message || "Dues generated successfully");
      setGenerateModalOpen(false);
      fetchDues();
    } catch (err: any) {
      notify.error(err.message || "Error generating dues");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            Membership Dues, Monthly Chanda & Annual Fees
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track annual dues, monthly subscription chanda, record collections, and issue official receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission("membership:collect") && (
            <Button
              variant="gold"
              onClick={() => handleOpenCollectModal()}
              icon={<Receipt className="w-4 h-4" />}
            >
              Collect Fees
            </Button>
          )}

          {hasPermission("settings:manage") && (
            <Button
              variant="outline"
              onClick={() => {
                setGenPeriodId(periods[0]?.id ? String(periods[0].id) : "");
                setGenerateModalOpen(true);
              }}
              icon={<Layers className="w-4 h-4" />}
            >
              Generate Dues
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search advocate by name, code or reg..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700/80 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
            {/* Period select */}
            <select
              value={periodId}
              onChange={(e) => {
                setPeriodId(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Periods</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.period_name} {p.is_current ? "(Current)" : ""}
                </option>
              ))}
            </select>

            {/* Due Type select */}
            <select
              value={dueType}
              onChange={(e) => {
                setDueType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Due Types</option>
              <option value="monthly_chanda">Monthly Chanda</option>
              <option value="annual_dues">Annual Dues</option>
              <option value="admission_fee">Admission Fee</option>
            </select>

            {/* Status select */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid / Due</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Dues Register Table */}
        <div className="table-wrapper overflow-x-auto" tabIndex={0} role="region" aria-label="Membership dues and chanda table">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-navy-950/95 backdrop-blur-md border-y border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-300 shadow-sm">
              <tr>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Advocate</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Period</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Due Category</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Month / Cycle</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px] text-right">Amount</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px] text-right">Paid</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px] text-right">Balance</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Status</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs">Fetching dues records...</p>
                  </td>
                </tr>
              ) : dues.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No membership dues records found matching current criteria.
                  </td>
                </tr>
              ) : (
                dues.map((d) => {
                  const balance = Number(d.amount) - Number(d.paid_amount);
                  const monthName = d.due_month ? MONTHS.find((m) => m.value === d.due_month)?.name : null;

                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        <div>
                          <span className="font-semibold">{d.advocate_name}</span>
                          <p className="text-[10px] text-amber-600 dark:text-gold-400 font-mono">
                            {d.advocate_code} • {d.bar_council_reg_no}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {d.period_name || d.due_year}
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-800 dark:text-slate-200">
                        {d.due_type.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {monthName ? `${monthName} ${d.due_year}` : `Annual ${d.due_year}`}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(d.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(d.paid_amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {balance > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatCurrency(balance)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">Nil</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            d.status === "paid"
                              ? "success"
                              : d.status === "partial"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {d.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {balance > 0 && hasPermission("membership:collect") ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenCollectModal(d.advocate_id, balance)}
                            className="text-xs h-7 px-2"
                          >
                            Pay Due
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Cleared</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </Card>

      {/* Collect Fee Modal */}
      <Modal
        isOpen={collectModalOpen}
        onClose={() => setCollectModalOpen(false)}
        title="Collect Membership Fees & Dues"
        subtitle="Records payment into association accounts and automatically allocates against unpaid dues."
        size="md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Advocate Member *
            </label>
            <select
              value={selectedAdvocateId}
              onChange={(e) => setSelectedAdvocateId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              required
            >
              {advocatesList.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.full_name} ({adv.advocate_code} • {adv.bar_council_reg_no})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Payment Amount (₹)"
            type="number"
            required
            min="1"
            placeholder="e.g. 1200"
            value={collectAmount}
            onChange={(e) => setCollectAmount(e.target.value)}
          />

          <Select
            label="Payment Mode"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            options={[
              { value: "UPI", label: "UPI / QR Code" },
              { value: "Cash", label: "Cash" },
              { value: "Bank Transfer", label: "Bank Transfer / NEFT / RTGS" },
              { value: "Cheque", label: "Cheque" },
              { value: "DD", label: "Demand Draft (DD)" },
            ]}
          />

          <Input
            label="Transaction Reference / Cheque No."
            placeholder="e.g. UPI/2026/0410 or Cheque No."
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Notes / Remarks
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="e.g. Cleared 2026-2027 Annual Dues in full..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCollectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              loading={submittingPayment}
            >
              Record Payment & Issue Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Batch Generate Dues Modal */}
      <Modal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Batch Generate Membership Dues"
        subtitle="Generates unpaid monthly chanda or annual dues for all active advocate members."
        size="md"
      >
        <form onSubmit={handleGenerateSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Membership Period *
            </label>
            <select
              value={genPeriodId}
              onChange={(e) => setGenPeriodId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              required
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.period_name} {p.is_current ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          <Select
            label="Due Category"
            value={genDueType}
            onChange={(e) => {
              setGenDueType(e.target.value);
              setGenAmount(e.target.value === "annual_dues" ? 1200 : 100);
            }}
            options={[
              { value: "monthly_chanda", label: "Monthly Chanda (Subscription)" },
              { value: "annual_dues", label: "Annual Dues" },
            ]}
          />

          {genDueType === "monthly_chanda" && (
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Month"
                value={genMonth}
                onChange={(e) => setGenMonth(Number(e.target.value))}
                options={MONTHS.map((m) => ({ value: m.value, label: m.name }))}
              />
              <Input
                label="Year"
                type="number"
                value={genYear}
                onChange={(e) => setGenYear(Number(e.target.value))}
              />
            </div>
          )}

          <Input
            label="Default Fee Amount (₹)"
            type="number"
            required
            value={genAmount}
            onChange={(e) => setGenAmount(Number(e.target.value))}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setGenerateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={generating}
            >
              Generate Dues for Active Advocates
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Official Payment Receipt"
        subtitle="Bar Association Official Financial Acknowledgment"
        size="lg"
      >
        {currentReceipt && (
          <div className="space-y-6">
            <div className="p-8 rounded-2xl border-2 border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 shadow-xl print-break-inside space-y-6">
              {/* Receipt Header */}
              <div className="text-center border-b border-slate-200 dark:border-navy-800 pb-4 space-y-1">
                <h3 className="text-lg font-black tracking-wide text-navy-900 dark:text-gold-400">
                  DISTRICT BAR ASSOCIATION
                </h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest">
                  Bar Council Complex • Official Fee & Chanda Receipt
                </p>
                <div className="pt-2 flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-amber-600 dark:text-gold-400">
                    Receipt No: {currentReceipt.receipt_no}
                  </span>
                  <span>Date: {formatDate(currentReceipt.payment_date)}</span>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-navy-900">
                  <span className="text-slate-500">Received With Thanks From:</span>
                  <span className="font-bold">{currentReceipt.advocate?.full_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-navy-900">
                  <span className="text-slate-500">Advocate Enrolment Code:</span>
                  <span className="font-mono">{currentReceipt.advocate?.advocate_code}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-navy-900">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-semibold">{currentReceipt.payment_mode} ({currentReceipt.reference_number || "Direct"})</span>
                </div>
                <div className="flex justify-between py-2 border-b-2 border-slate-300 dark:border-navy-700 text-sm">
                  <span className="font-bold">Total Amount Collected:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                    {formatCurrency(currentReceipt.amount)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex items-center justify-between text-xs text-slate-500">
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <span>Advocate Signature</span>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Authorized Treasurer / Cashier
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 no-print">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReceiptModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={() => window.print()}
                icon={<Printer className="w-3.5 h-3.5" />}
              >
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
