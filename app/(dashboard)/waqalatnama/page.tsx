"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileCheck2,
  Search,
  Plus,
  ArrowRight,
  Package,
  AlertTriangle,
  Receipt,
  Printer,
  History,
  TrendingDown,
  Layers,
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

export default function WaqalatnamaPage() {
  const { hasPermission } = useAuth();
  const { notify } = useNotification();

  const [activeTab, setActiveTab] = useState<"sales" | "inventory" | "movements">("sales");

  // Items & Stock
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Sales
  const [sales, setSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Movements
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Advocates for sale selector
  const [advocates, setAdvocates] = useState<any[]>([]);

  // Sale Modal
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [selectedAdvocateId, setSelectedAdvocateId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("5");
  const [discount, setDiscount] = useState("0");
  const [amountReceived, setAmountReceived] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [submittingSale, setSubmittingSale] = useState(false);

  // Add Stock Modal
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockItemId, setStockItemId] = useState("");
  const [stockMovementType, setStockMovementType] = useState("received");
  const [stockQuantity, setStockQuantity] = useState("100");
  const [stockUnitPrice, setStockUnitPrice] = useState("");
  const [stockRefNo, setStockRefNo] = useState("");
  const [stockNotes, setStockNotes] = useState("");
  const [submittingStock, setSubmittingStock] = useState(false);

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch("/api/waqalatnama/items");
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch {
      notify.error("Failed to load inventory");
    } finally {
      setLoadingItems(false);
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
      const res = await fetch(`/api/waqalatnama/sales?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSales(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalRecords(json.pagination.total);
      }
    } catch {
      notify.error("Failed to load sales register");
    } finally {
      setLoadingSales(false);
    }
  }, [page, pageSize, search]);

  const fetchMovements = async () => {
    setLoadingMovements(true);
    try {
      const res = await fetch("/api/waqalatnama/movements");
      const json = await res.json();
      if (json.success) setMovements(json.data);
    } catch {
      notify.error("Failed to load stock movements");
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchSales();
    fetch("/api/advocates?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAdvocates(d.data);
      });
  }, []);

  useEffect(() => {
    if (activeTab === "sales") fetchSales();
    if (activeTab === "inventory") fetchItems();
    if (activeTab === "movements") fetchMovements();
  }, [activeTab, fetchSales]);

  // Handle item selection in Sale Modal to auto-fill unit rate & received amount
  const handleItemSelect = (itemId: string, qtyStr: string) => {
    setSelectedItemId(itemId);
    const item = items.find((i) => String(i.id) === itemId);
    const rate = item ? Number(item.unit_rate) : 0;
    const qty = Number(qtyStr) || 1;
    const total = rate * qty;
    setAmountReceived(String(total));
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSale(true);

    const item = items.find((i) => String(i.id) === selectedItemId);
    if (!item) {
      notify.error("Please select a Waqalatnama item");
      setSubmittingSale(false);
      return;
    }

    try {
      const res = await fetch("/api/waqalatnama/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advocate_id: selectedAdvocateId ? Number(selectedAdvocateId) : null,
          customer_name:
            customerName ||
            (selectedAdvocateId
              ? advocates.find((a) => String(a.id) === selectedAdvocateId)?.full_name
              : "Advocate Client"),
          items: [
            {
              item_id: Number(selectedItemId),
              quantity: Number(quantity),
              unit_rate: Number(item.unit_rate),
            },
          ],
          discount: Number(discount),
          amount_received: Number(amountReceived),
          payment_mode: paymentMode,
          remarks,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Sale creation failed");
        return;
      }

      notify.success("Waqalatnama sale completed successfully");
      setSaleModalOpen(false);
      setCurrentReceipt({
        ...json.data,
        item_name: item.item_name,
        quantity,
      });
      setReceiptModalOpen(true);
      fetchItems();
      fetchSales();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setSubmittingSale(false);
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStock(true);

    try {
      const res = await fetch("/api/waqalatnama/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: Number(stockItemId),
          movement_type: stockMovementType,
          quantity: Number(stockQuantity),
          unit_price: Number(stockUnitPrice) || 0,
          reference_no: stockRefNo,
          notes: stockNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Stock update failed");
        return;
      }

      notify.success("Stock updated successfully");
      setStockModalOpen(false);
      fetchItems();
    } catch (err: any) {
      notify.error(err.message || "Failed to update stock");
    } finally {
      setSubmittingStock(false);
    }
  };

  const totalStockUnits = items.reduce((acc, i) => acc + (Number(i.current_stock) || 0), 0);
  const lowStockItems = items.filter((i) => Number(i.current_stock) <= Number(i.low_stock_threshold));

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-gold-500" />
            Waqalatnama Stock & Sales Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain official Waqalatnama stock levels, print issues, and advocate sales ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission("waqalatnama:sell") && (
            <Button
              variant="gold"
              onClick={() => {
                setSelectedItemId(items[0]?.id ? String(items[0].id) : "");
                handleItemSelect(items[0]?.id ? String(items[0].id) : "", "5");
                setSaleModalOpen(true);
              }}
              icon={<Receipt className="w-4 h-4" />}
            >
              Sell Waqalatnama
            </Button>
          )}

          {hasPermission("waqalatnama:stock") && (
            <Button
              variant="outline"
              onClick={() => {
                setStockItemId(items[0]?.id ? String(items[0].id) : "");
                setStockModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Stock / Adjust
            </Button>
          )}
        </div>
      </div>

      {/* Stock Overview Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900">
          <p className="text-xs text-slate-500">Total Available Stock</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {totalStockUnits} <span className="text-xs font-normal text-slate-400">units</span>
          </h3>
        </div>

        {items.slice(0, 3).map((item) => (
          <div key={item.id} className="p-4 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 truncate">{item.item_name}</p>
              {Number(item.current_stock) <= Number(item.low_stock_threshold) && (
                <span className="w-2 h-2 rounded-full bg-rose-500" title="Low Stock Alert" />
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {item.current_stock}{" "}
              <span className="text-xs font-normal text-amber-600 dark:text-gold-400">
                (@ ₹{item.unit_rate})
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
          Item Master & Stock Levels ({items.length})
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "movements"
              ? "bg-navy-800 text-white dark:bg-gold-500 dark:text-navy-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
          }`}
        >
          Stock Movement Ledger
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
                placeholder="Search by sale number or advocate..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700/80 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="table-wrapper overflow-x-auto" tabIndex={0} role="region" aria-label="Waqalatnama sales register table">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-navy-950/95 backdrop-blur-md border-y border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-300 shadow-sm">
                <tr>
                  <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Sale No</th>
                  <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Buyer / Advocate</th>
                  <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Date</th>
                  <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Items Sold</th>
                  <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px] text-right">Net Amount</th>
                  <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px] text-right">Received</th>
                  <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Mode</th>
                  <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
                {loadingSales ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading sales records...
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No Waqalatnama sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                        {s.sale_no}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {s.advocate_name || s.customer_name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(s.sale_date)}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {s.items_summary || "Waqalatnama copies"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(s.net_amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(s.amount_received)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {s.payment_mode}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            s.payment_status === "paid"
                              ? "success"
                              : s.payment_status === "partial"
                              ? "warning"
                              : "danger"
                          }
                        >
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

      {/* TAB 2: Item Master & Stock */}
      {activeTab === "inventory" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/60 border-b border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Item Code</th>
                  <th className="py-3 px-4 font-semibold">Item Name</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold text-right">Unit Rate</th>
                  <th className="py-3 px-4 font-semibold text-right">Available Stock</th>
                  <th className="py-3 px-4 font-semibold text-right">Threshold</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Sold</th>
                  <th className="py-3 px-4 font-semibold text-center">Stock Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
                {items.map((item) => {
                  const isLow = Number(item.current_stock) <= Number(item.low_stock_threshold);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                        {item.item_code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {item.item_name}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {item.description || "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.unit_rate)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-base text-slate-900 dark:text-slate-100">
                        {item.current_stock}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {item.low_stock_threshold}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.total_sold} units
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <Badge variant="danger" size="sm">
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Adequate
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: Movements Ledger */}
      {activeTab === "movements" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/60 border-b border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Item</th>
                  <th className="py-3 px-4 font-semibold">Movement Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Quantity Delta</th>
                  <th className="py-3 px-4 font-semibold text-right">Stock After</th>
                  <th className="py-3 px-4 font-semibold">Reference</th>
                  <th className="py-3 px-4 font-semibold">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                      <td className="py-3 px-4 text-slate-500">{m.created_at}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {m.item_name}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        <Badge
                          variant={
                            m.movement_type === "received" || m.movement_type === "opening"
                              ? "success"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {m.movement_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={m.quantity > 0 ? "text-emerald-600" : "text-rose-600"}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100">
                        {m.balance_after}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
                        {m.reference_no || "-"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{m.user_name || "Admin"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Sale Waqalatnama Modal */}
      <Modal
        isOpen={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        title="Issue / Sell Waqalatnama"
        subtitle="Stock will be atomically verified and decremented upon recording."
        size="md"
      >
        <form onSubmit={handleSaleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Advocate (Optional for Walk-in)
            </label>
            <select
              value={selectedAdvocateId}
              onChange={(e) => {
                setSelectedAdvocateId(e.target.value);
                const adv = advocates.find((a) => String(a.id) === e.target.value);
                if (adv) setCustomerName(adv.full_name);
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
            >
              <option value="">-- Non-Member / Walk-in Advocate --</option>
              {advocates.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.full_name} ({adv.advocate_code})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Customer / Advocate Name"
            placeholder="e.g. Adv. Deepak Sharma"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Waqalatnama Type *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleItemSelect(e.target.value, quantity)}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              required
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name} — Rate: ₹{item.unit_rate} (Available: {item.current_stock})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                handleItemSelect(selectedItemId, e.target.value);
              }}
            />
            <Input
              label="Discount (₹)"
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount Received (₹)"
              type="number"
              required
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
            />
            <Select
              label="Payment Mode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              options={[
                { value: "Cash", label: "Cash" },
                { value: "UPI", label: "UPI / QR" },
                { value: "Bank Transfer", label: "Bank Transfer" },
                { value: "Credit", label: "Credit / Pending" },
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
              placeholder="e.g. Issued 5 High Court Waqalatnama..."
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
              Record Sale & Deduct Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Stock Modal */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title="Add Stock / Inventory Inward"
        subtitle="Record fresh purchases or manual stock adjustments."
        size="md"
      >
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Item *
            </label>
            <select
              value={stockItemId}
              onChange={(e) => setStockItemId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              required
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name} (Current: {item.current_stock})
                </option>
              ))}
            </select>
          </div>

          <Select
            label="Movement Type"
            value={stockMovementType}
            onChange={(e) => setStockMovementType(e.target.value)}
            options={[
              { value: "received", label: "Stock Received (Fresh Delivery)" },
              { value: "adjustment", label: "Stock Adjustment (Correction)" },
              { value: "return", label: "Customer Return" },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity to Add"
              type="number"
              required
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
            />
            <Input
              label="Unit Cost (₹)"
              type="number"
              placeholder="e.g. 25"
              value={stockUnitPrice}
              onChange={(e) => setStockUnitPrice(e.target.value)}
            />
          </div>

          <Input
            label="Invoice / Supplier Reference"
            placeholder="e.g. INV-PRINTER-4491"
            value={stockRefNo}
            onChange={(e) => setStockRefNo(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Notes
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="Supplier name, delivery batch details..."
              value={stockNotes}
              onChange={(e) => setStockNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStockModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submittingStock}
            >
              Update Stock Level
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sales Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Waqalatnama Cash Receipt"
        subtitle="Official Bar Association Sale Invoice"
        size="md"
      >
        {currentReceipt && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border-2 border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 shadow-xl space-y-4 print-break-inside">
              <div className="text-center border-b border-slate-200 dark:border-navy-800 pb-3">
                <h4 className="font-black text-sm uppercase tracking-wide text-navy-900 dark:text-gold-400">
                  BAR ASSOCIATION SALE COUNTER
                </h4>
                <p className="text-[10px] text-slate-400">Official Waqalatnama Sales Receipt</p>
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
                  <span className="font-bold">{currentReceipt.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span>{currentReceipt.item_name} (Qty: {currentReceipt.quantity})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span>{currentReceipt.payment_mode}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-b border-slate-200 dark:border-navy-800 text-sm font-bold">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(currentReceipt.received)}
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
