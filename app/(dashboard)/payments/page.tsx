"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  Search,
  Filter,
  Printer,
  CreditCard,
  Building,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";

export default function PaymentsPage() {
  const { hasPermission } = useAuth();
  const { notify } = useNotification();

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search,
        module: moduleFilter,
        paymentMode: modeFilter,
      });
      const res = await fetch(`/api/payments?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setPayments(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalRecords(json.pagination.total);
      }
    } catch {
      notify.error("Failed to load payments ledger");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, moduleFilter, modeFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalCollectedInView = payments.reduce((acc, p) => acc + (p.status === "completed" ? Number(p.amount) : 0), 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-gold-500" />
            Centralized Payments & Receipts Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consolidated audit trail of all collections across membership, sales, donations, and fees.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total in Current View: </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 ml-1">
              {formatCurrency(totalCollectedInView)}
            </span>
          </div>
        </div>
      </div>

      <Card>
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by receipt no, payer, ref..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700/80 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Modules</option>
              <option value="membership">Membership Fees</option>
              <option value="waqalatnama">Waqalatnama Sales</option>
              <option value="form_sale">Form Sales</option>
              <option value="donation">Donations</option>
              <option value="other_income">Other Income</option>
            </select>

            <select
              value={modeFilter}
              onChange={(e) => {
                setModeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper overflow-x-auto" tabIndex={0} role="region" aria-label="Payments ledger table">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-navy-950/95 backdrop-blur-md border-y border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-300 shadow-sm">
              <tr>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Receipt No</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Date</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Payer / Advocate</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Source Module</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Mode & Ref</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px] text-right">Amount Collected</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Cashier</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Status</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px] text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading payments ledger...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                      {p.receipt_no}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(p.payment_date)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div>{p.advocate_name || p.payer_name || "Advocate"}</div>
                      {p.advocate_code && (
                        <p className="text-[10px] text-slate-400 font-mono">{p.advocate_code}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <Badge variant="neutral" size="sm">
                        {p.source_module ? String(p.source_module).replace(/_/g, " ") : "Payment"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div>{p.payment_mode}</div>
                      {p.reference_number && (
                        <div className="text-[10px] text-slate-400 font-mono">{p.reference_number}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{p.received_by_name || "Staff"}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success" size="sm">
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedReceipt(p);
                          setReceiptModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 dark:hover:text-gold-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                        title="Print Official Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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

      {/* Official Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Official Collection Receipt"
        subtitle="Bar Association Verified Financial Voucher"
        size="md"
      >
        {selectedReceipt && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border-2 border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 shadow-xl space-y-4 print-break-inside">
              <div className="text-center border-b border-slate-200 dark:border-navy-800 pb-3">
                <h4 className="font-black text-sm uppercase tracking-wide text-navy-900 dark:text-gold-400">
                  DISTRICT BAR ASSOCIATION
                </h4>
                <p className="text-[10px] text-slate-400">Official Payment Receipt & Acknowledgment</p>
                <div className="flex justify-between text-xs font-mono pt-2">
                  <span className="font-bold text-amber-600 dark:text-gold-400">
                    {selectedReceipt.receipt_no}
                  </span>
                  <span>Date: {formatDate(selectedReceipt.payment_date)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payer Name:</span>
                  <span className="font-bold">{selectedReceipt.advocate_name || selectedReceipt.payer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Head:</span>
                  <span className="font-semibold capitalize">{selectedReceipt.source_module ? String(selectedReceipt.source_module).replace(/_/g, " ") : "Payment"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Instrument:</span>
                  <span>{selectedReceipt.payment_mode} ({selectedReceipt.reference_number || "Direct"})</span>
                </div>
                {selectedReceipt.notes && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Particulars:</span>
                    <span className="italic">{selectedReceipt.notes}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t border-b border-slate-200 dark:border-navy-800 text-sm font-bold">
                  <span>Net Amount Paid:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-base font-black">
                    {formatCurrency(selectedReceipt.amount)}
                  </span>
                </div>
              </div>

              <div className="pt-6 flex justify-between text-xs text-slate-400">
                <span>Received By: {selectedReceipt.received_by_name || "Treasurer"}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Authorized Signatory
                </span>
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
