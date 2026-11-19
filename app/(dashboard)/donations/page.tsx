"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  HeartHandshake,
  Search,
  Plus,
  Receipt,
  Printer,
  Download,
  Filter,
  CheckCircle2,
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

export default function DonationsPage() {
  const { hasPermission } = useAuth();
  const { notify } = useNotification();

  const [donations, setDonations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // New Donation Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [contributorName, setContributorName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [refNo, setRefNo] = useState("");
  const [donationStatus, setDonationStatus] = useState("received");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);

  useEffect(() => {
    fetch("/api/donations/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      });
  }, []);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search,
        status,
      });
      const res = await fetch(`/api/donations?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDonations(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalRecords(json.pagination.total);
      }
    } catch {
      notify.error("Failed to fetch donations");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributor_name: contributorName,
          phone,
          email,
          pan_number: panNumber,
          amount: Number(amount),
          category_id: categoryId ? Number(categoryId) : null,
          donation_purpose: purpose,
          payment_mode: paymentMode,
          reference_number: refNo,
          status: donationStatus,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Failed to record donation");
        return;
      }

      notify.success("Donation recorded successfully");
      const cat = categories.find((c) => c.id === Number(categoryId));
      setDonations((prev) => [
        {
          id: json.data?.donationId || Date.now(),
          donation_no: json.data?.donation_no || `DON-${new Date().getFullYear()}-${Date.now()}`,
          receipt_no: json.data?.receipt_number || `RCP-DON-${Date.now()}`,
          contributor_name: contributorName,
          donor_name: contributorName,
          category_name: cat?.name || "General Corpus",
          amount: Number(amount),
          payment_mode: paymentMode,
          status: donationStatus,
          donation_date: new Date().toISOString().split("T")[0],
        },
        ...prev,
      ]);
      setModalOpen(false);
      setCurrentReceipt(json.data);
      setReceiptModalOpen(true);
      fetchDonations();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const totalCollected = donations.reduce((sum, d) => sum + (d.status === "received" ? Number(d.amount) : 0), 0);

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-gold-500" />
            Donations & Welfare Corpus Contributions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Acknowledge voluntary contributions, endowment funds, and issue tax-compliant association receipts.
          </p>
        </div>

        {hasPermission("donations:manage") && (
          <Button
            variant="gold"
            onClick={() => {
              setContributorName("");
              setPhone("");
              setEmail("");
              setPanNumber("");
              setAmount("");
              setCategoryId(categories[0]?.id ? String(categories[0].id) : "");
              setPurpose("");
              setRefNo("");
              setModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Record Donation
          </Button>
        )}
      </div>

      {/* Register Card */}
      <Card>
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by contributor name, PAN, purpose..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700/80 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="received">Received</option>
              <option value="pledged">Pledged</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950/60 border-y border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Donation No</th>
                <th className="py-3 px-4 font-semibold">Contributor Name</th>
                <th className="py-3 px-4 font-semibold">PAN / Contact</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Category & Purpose</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold">Mode & Ref</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading donations...
                  </td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No donation records found.
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                      {d.donation_no}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {d.contributor_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <div>{d.pan_number ? `PAN: ${d.pan_number}` : "-"}</div>
                      {d.phone && <div className="text-[10px] text-slate-400">{d.phone}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(d.donation_date)}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {d.donation_purpose}
                      </div>
                      <div className="text-[10px] text-slate-400">{d.category_name || "General"}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(d.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{d.payment_mode}</div>
                      {d.reference_number && (
                        <div className="text-[10px] text-slate-400 font-mono">{d.reference_number}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={d.status === "received" ? "success" : "warning"} size="sm">
                        {d.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setCurrentReceipt(d);
                          setReceiptModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 dark:hover:text-gold-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                        title="Print Donation Receipt"
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

      {/* Record Donation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Association Donation"
        subtitle="Acknowledge contributor, record purpose, and issue official acknowledgment."
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Contributor Name *"
            required
            placeholder="e.g. Senior Advocate Ashok Sen"
            value={contributorName}
            onChange={(e) => setContributorName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="PAN Number"
              placeholder="e.g. ABCDE1234F"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
            />
            <Input
              label="Phone Number"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="e.g. 9876543210 (10 digits)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contribution Amount (₹) *"
              type="number"
              required
              min="1"
              placeholder="e.g. 25000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Donation Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Donation Purpose *"
            required
            placeholder="e.g. Library Computerization and Digital Journals"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Payment Mode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              options={[
                { value: "Bank Transfer", label: "Bank Transfer / RTGS / NEFT" },
                { value: "Cheque", label: "Cheque" },
                { value: "UPI", label: "UPI / QR" },
                { value: "Cash", label: "Cash" },
              ]}
            />
            <Input
              label="Reference / Cheque No."
              placeholder="e.g. NEFT-HDFC-99120"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Notes
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="Donor designation, committee resolution, special conditions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              loading={submitting}
            >
              Record Donation & Issue Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Donation Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Donation Acknowledgment Receipt"
        subtitle="Bar Association Official Welfare Acknowledgment"
        size="md"
      >
        {currentReceipt && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border-2 border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 shadow-xl space-y-4 print-break-inside">
              <div className="text-center border-b border-slate-200 dark:border-navy-800 pb-3">
                <h4 className="font-black text-sm uppercase tracking-wide text-navy-900 dark:text-gold-400">
                  DISTRICT BAR ASSOCIATION WELFARE TRUST
                </h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                  Official Voluntary Donation Receipt
                </p>
                <div className="flex justify-between text-xs font-mono pt-2">
                  <span className="font-bold text-amber-600 dark:text-gold-400">
                    {currentReceipt.donation_no || currentReceipt.receipt_number}
                  </span>
                  <span>Date: {formatDate(currentReceipt.donation_date)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Received With Gratitude From:</span>
                  <span className="font-bold">{currentReceipt.contributor_name}</span>
                </div>
                {currentReceipt.pan_number && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contributor PAN:</span>
                    <span className="font-mono">{currentReceipt.pan_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Purpose / Fund:</span>
                  <span className="font-semibold">{currentReceipt.donation_purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Instrument:</span>
                  <span>{currentReceipt.payment_mode} ({currentReceipt.reference_number || "Direct"})</span>
                </div>
                <div className="flex justify-between py-2 border-t border-b border-slate-200 dark:border-navy-800 text-sm font-bold">
                  <span>Donation Amount:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-base font-black">
                    {formatCurrency(currentReceipt.amount)}
                  </span>
                </div>
              </div>

              <div className="pt-6 flex justify-between text-xs text-slate-400">
                <span>Subject to Realization</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Authorized Signatory / Secretary
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
