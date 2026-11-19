"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Plus,
  Receipt,
  Printer,
  Package,
  Layers,
  ArrowRight,
  TrendingUp,
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

export default function FormSalesPage() {
  const { hasPermission } = useAuth();
  const { notify } = useNotification();

  const [activeTab, setActiveTab] = useState<"sales" | "inventory">("sales");

  // Form Types Master
  const [formTypes, setFormTypes] = useState<any[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Sales Register
  const [sales, setSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Advocates
  const [advocates, setAdvocates] = useState<any[]>([]);

  // Sale Modal
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [selectedFormTypeId, setSelectedFormTypeId] = useState("");
  const [selectedAdvocateId, setSelectedAdvocateId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [submittingSale, setSubmittingSale] = useState(false);

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);

  const fetchTypes = async () => {
    setLoadingTypes(true);
    try {
      const res = await fetch("/api/form-sales/types");
      const json = await res.json();
      if (json.success) setFormTypes(json.data);
    } catch {
      notify.error("Failed to load form types");
    } finally {
      setLoadingTypes(false);
    }
  };

  const fetchSales = useCallback(async () => {
    setLoadingSales(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search,
      });
      const res = await fetch(`/api/form-sales?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSales(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalRecords(json.pagination.total);
      }
    } catch {
      notify.error("Failed to load form sales");
    } finally {
      setLoadingSales(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchTypes();
    fetchSales();
    fetch("/api/advocates?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAdvocates(d.data);
      });
  }, []);

  useEffect(() => {
    if (activeTab === "sales") fetchSales();
    if (activeTab === "inventory") fetchTypes();
  }, [activeTab, fetchSales]);

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSale(true);

    const type = formTypes.find((t) => String(t.id) === selectedFormTypeId);
    if (!type) {
      notify.error("Please select a form type");
      setSubmittingSale(false);
      return;
    }

    try {
      const res = await fetch("/api/form-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_type_id: Number(selectedFormTypeId),
          advocate_id: selectedAdvocateId ? Number(selectedAdvocateId) : null,
          buyer_name:
            buyerName ||
            (selectedAdvocateId
              ? advocates.find((a) => String(a.id) === selectedAdvocateId)?.full_name
              : "Applicant Member"),
          quantity: Number(quantity),
          payment_mode: paymentMode,
          remarks,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Form sale recording failed");
        return;
      }

      notify.success("Form sale recorded successfully");
      const formType = formTypes.find((f) => String(f.id) === selectedFormTypeId);
      const customer = buyerName || (selectedAdvocateId ? advocates.find((a) => String(a.id) === selectedAdvocateId)?.full_name : "Applicant Member");
      const adv = selectedAdvocateId ? advocates.find((a) => String(a.id) === selectedAdvocateId) : null;
      setSales((prev) => [
        {
          id: json.data?.saleId || Date.now(),
          sale_no: json.data?.sale_no || `FSL-${new Date().getFullYear()}-${Date.now()}`,
          form_name: formType?.form_name || "Form",
          form_code: formType?.form_code || "FORM",
          buyer_type: selectedAdvocateId ? "advocate" : "public",
          buyer_name: customer,
          advocate_name: adv?.full_name || customer,
          advocate_code: adv?.advocate_code || "",
          quantity: Number(quantity),
          unit_price: Number(formType?.sale_price || 50),
          total_amount: Number(formType?.sale_price || 50) * Number(quantity),
          amount_received: Number(formType?.sale_price || 50) * Number(quantity),
          payment_mode: paymentMode,
          sale_date: new Date().toISOString().split("T")[0],
        },
        ...prev,
      ]);
      setSaleModalOpen(false);
      setCurrentReceipt(json.data);
      setReceiptModalOpen(true);
      fetchTypes();
      fetchSales();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setSubmittingSale(false);
    }
  };

  const totalFormsInStock = formTypes.reduce((acc, t) => acc + (Number(t.current_stock) || 0), 0);
  const totalFormsSold = formTypes.reduce((acc, t) => acc + (Number(t.total_sold) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-gold-500" />
            Association Form Sales Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage membership applications, welfare enrollment kits, and certificates inventory.
          </p>
        </div>

        {hasPermission("form_sales:sell") && (
          <Button
            variant="gold"
            onClick={() => {
              setSelectedFormTypeId(formTypes[0]?.id ? String(formTypes[0].id) : "");
              setSaleModalOpen(true);
            }}
            icon={<Receipt className="w-4 h-4" />}
          >
            Issue / Sell Form
          </Button>
        )}
      </div>

      {/* Mini Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900">
          <p className="text-xs text-slate-500">Total Available Forms</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {totalFormsInStock} <span className="text-xs font-normal text-slate-400">units</span>
          </h3>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900">
          <p className="text-xs text-slate-500">Total Forms Sold</p>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {totalFormsSold} <span className="text-xs font-normal text-slate-400">forms</span>
          </h3>
        </div>

        {formTypes.slice(0, 2).map((t) => (
          <div key={t.id} className="p-4 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900">
            <p className="text-xs text-slate-500 truncate">{t.form_name}</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {t.current_stock}{" "}
              <span className="text-xs font-normal text-amber-600 dark:text-gold-400">
                (@ ₹{t.sale_price})
              </span>
            </h3>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-navy-800 pb-2">
        <button
          onClick={() => setActiveTab("sales")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "sales"
              ? "bg-navy-800 text-white dark:bg-gold-500 dark:text-navy-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
          }`}
        >
          Sales Register
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "inventory"
              ? "bg-navy-800 text-white dark:bg-gold-500 dark:text-navy-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
          }`}
        >
          Form Types & Prices ({formTypes.length})
        </button>
      </div>

      {/* TAB 1: Sales Register */}
      {activeTab === "sales" && (
        <Card>
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by sale number, buyer or form..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700/80 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/60 border-y border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Sale No</th>
                  <th className="py-3 px-4 font-semibold">Buyer Name</th>
                  <th className="py-3 px-4 font-semibold">Form Type</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Qty</th>
                  <th className="py-3 px-4 font-semibold text-right">Unit Rate</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Amount</th>
                  <th className="py-3 px-4 font-semibold">Payment Mode</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
                {loadingSales ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Loading sales records...
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No form sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                        {s.sale_no}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {s.buyer_name}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {s.form_name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(s.sale_date)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                        {s.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600 dark:text-slate-300">
                        {formatCurrency(s.unit_price)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(s.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {s.payment_mode}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="success" size="sm">
                          {s.payment_status}
                        </Badge>
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
      )}

      {/* TAB 2: Form Types Master */}
      {activeTab === "inventory" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/60 border-b border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Form Code</th>
                  <th className="py-3 px-4 font-semibold">Form Title</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold text-right">Sale Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Available Stock</th>
                  <th className="py-3 px-4 font-semibold text-right">Low Stock Alert</th>
                  <th className="py-3 px-4 font-semibold text-right">Forms Sold</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
                {formTypes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                      {t.form_code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {t.form_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {t.description || "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(t.sale_price)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100 text-base">
                      {t.current_stock}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {t.low_stock_threshold}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {t.total_sold}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={t.current_stock <= t.low_stock_threshold ? "danger" : "success"} size="sm">
                        {t.current_stock <= t.low_stock_threshold ? "Low Stock" : "In Stock"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Sell Form Modal */}
      <Modal
        isOpen={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        title="Issue / Sell Association Form"
        subtitle="Receipt generated instantly and stock inventory decremented."
        size="md"
      >
        <form onSubmit={handleSaleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Form Type *
            </label>
            <select
              value={selectedFormTypeId}
              onChange={(e) => setSelectedFormTypeId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              required
            >
              {formTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.form_name} — ₹{t.sale_price} (Available: {t.current_stock})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Advocate (Optional)
            </label>
            <select
              value={selectedAdvocateId}
              onChange={(e) => {
                setSelectedAdvocateId(e.target.value);
                const adv = advocates.find((a) => String(a.id) === e.target.value);
                if (adv) setBuyerName(adv.full_name);
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
            >
              <option value="">-- Fresh Applicant / Walk-in Buyer --</option>
              {advocates.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.full_name} ({adv.advocate_code})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Buyer / Applicant Name"
            required
            placeholder="e.g. Ramesh Kumar (New Enrolment Applicant)"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Select
              label="Payment Mode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              options={[
                { value: "Cash", label: "Cash" },
                { value: "UPI", label: "UPI / QR" },
                { value: "Bank Transfer", label: "Bank Transfer" },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Remarks
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="Application reference or notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSaleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              loading={submittingSale}
            >
              Issue Form & Print Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Official Form Sale Receipt"
        subtitle="Bar Association Official Sales Counter"
        size="md"
      >
        {currentReceipt && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border-2 border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 shadow-xl space-y-4 print-break-inside">
              <div className="text-center border-b border-slate-200 dark:border-navy-800 pb-3">
                <h4 className="font-black text-sm uppercase tracking-wide text-navy-900 dark:text-gold-400">
                  BAR ASSOCIATION SALES COUNTER
                </h4>
                <p className="text-[10px] text-slate-400">Official Form Sale Receipt</p>
                <div className="flex justify-between text-xs font-mono pt-2">
                  <span className="font-bold text-amber-600 dark:text-gold-400">
                    {currentReceipt.sale_no}
                  </span>
                  <span>Date: {formatDate(currentReceipt.sale_date)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Issued To:</span>
                  <span className="font-bold">{currentReceipt.buyer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Form:</span>
                  <span className="font-semibold">{currentReceipt.form_name} (Qty: {currentReceipt.quantity})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span>{currentReceipt.payment_mode}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-b border-slate-200 dark:border-navy-800 text-sm font-bold">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(currentReceipt.total_amount)}
                  </span>
                </div>
              </div>

              <div className="text-center pt-4 text-[10px] text-slate-400">
                Printed & Issued by Bar Association Office Staff
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
