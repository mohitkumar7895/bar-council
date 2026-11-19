"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Receipt,
  Printer,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
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

export default function IncomeExpensesPage() {
  const { hasPermission } = useAuth();
  const { notify } = useNotification();

  const [activeTab, setActiveTab] = useState<"income" | "expenses">("income");

  // Income State
  const [incomes, setIncomes] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [incomeSearch, setIncomeSearch] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("all");
  const [incomePage, setIncomePage] = useState(1);
  const [incomeTotalPages, setIncomeTotalPages] = useState(1);
  const [incomeTotalRecords, setIncomeTotalRecords] = useState(0);
  const [loadingIncome, setLoadingIncome] = useState(true);

  // Expense State
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("all");
  const [expensePage, setExpensePage] = useState(1);
  const [expenseTotalPages, setExpenseTotalPages] = useState(1);
  const [expenseTotalRecords, setExpenseTotalRecords] = useState(0);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  // Categories
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);

  // Add Income Modal
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [incDate, setIncDate] = useState(new Date().toISOString().split("T")[0]);
  const [incCategory, setIncCategory] = useState("other_income");
  const [incDesc, setIncDesc] = useState("");
  const [incAmount, setIncAmount] = useState("");
  const [incMode, setIncMode] = useState("Cash");
  const [incRef, setIncRef] = useState("");
  const [incFrom, setIncFrom] = useState("");
  const [incNotes, setIncNotes] = useState("");
  const [submittingIncome, setSubmittingIncome] = useState(false);

  // Add Expense Modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [expCategoryId, setExpCategoryId] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expMode, setExpMode] = useState("Bank Transfer");
  const [expVendor, setExpVendor] = useState("");
  const [expRef, setExpRef] = useState("");
  const [expNotes, setExpNotes] = useState("");
  const [submittingExpense, setSubmittingExpense] = useState(false);

  useEffect(() => {
    fetch("/api/finance/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setExpenseCategories(d.data);
      });
  }, []);

  const fetchIncome = useCallback(async () => {
    setLoadingIncome(true);
    try {
      const params = new URLSearchParams({
        page: String(incomePage),
        limit: "15",
        search: incomeSearch,
        category: incomeCategory,
      });
      const res = await fetch(`/api/finance/income?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setIncomes(json.data);
        setTotalIncome(json.totalAmount);
        setIncomeTotalPages(json.pagination.totalPages);
        setIncomeTotalRecords(json.pagination.total);
      }
    } catch {
      notify.error("Failed to load income entries");
    } finally {
      setLoadingIncome(false);
    }
  }, [incomePage, incomeSearch, incomeCategory]);

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const params = new URLSearchParams({
        page: String(expensePage),
        limit: "15",
        search: expenseSearch,
        categoryId: expenseCategory,
      });
      const res = await fetch(`/api/finance/expenses?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setExpenses(json.data);
        setTotalExpenses(json.totalAmount);
        setExpenseTotalPages(json.pagination.totalPages);
        setExpenseTotalRecords(json.pagination.total);
      }
    } catch {
      notify.error("Failed to load expense entries");
    } finally {
      setLoadingExpenses(false);
    }
  }, [expensePage, expenseSearch, expenseCategory]);

  useEffect(() => {
    if (activeTab === "income") fetchIncome();
    if (activeTab === "expenses") fetchExpenses();
  }, [activeTab, fetchIncome, fetchExpenses]);

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingIncome(true);
    try {
      const res = await fetch("/api/finance/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: incDate,
          category: incCategory,
          description: incDesc,
          amount: Number(incAmount),
          payment_mode: incMode,
          reference_no: incRef,
          received_from: incFrom,
          notes: incNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Failed to record income");
        return;
      }

      notify.success("Income recorded successfully");
      const newIncId = json.data?.id || Date.now();
      const newIncNo = json.data?.income_no || `INC-${new Date().getFullYear()}-${newIncId}`;
      setIncomes((prev) => [
        {
          id: newIncId,
          income_no: newIncNo,
          category: incCategory,
          description: incDesc,
          amount: Number(incAmount),
          date: incDate,
          received_from: incFrom,
          payment_mode: incMode,
          payment_status: "paid",
        },
        ...prev,
      ]);
      setIncomeModalOpen(false);
      fetchIncome();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setSubmittingIncome(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingExpense(true);
    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: expDate,
          category_id: Number(expCategoryId),
          description: expDesc,
          amount: Number(expAmount),
          payment_mode: expMode,
          payee_vendor: expVendor,
          reference_number: expRef,
          notes: expNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Failed to record expense");
        return;
      }

      notify.success("Expense voucher recorded successfully");
      const cat = expenseCategories.find((c) => c.id === Number(expCategoryId));
      const newExpId = json.data?.id || Date.now();
      const newExpNo = json.data?.expense_no || `EXP-${new Date().getFullYear()}-${newExpId}`;
      setExpenses((prev) => [
        {
          id: newExpId,
          expense_no: newExpNo,
          category_name: cat?.name || "General Expense",
          description: expDesc,
          amount: Number(expAmount),
          date: expDate,
          payee_vendor: expVendor,
          payment_mode: expMode,
          payment_status: "paid",
        },
        ...prev,
      ]);
      setExpenseModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setSubmittingExpense(false);
    }
  };

  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-gold-500" />
            Accounting: Income, Expenses & Net Reserves
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            General ledger tracking association operating revenue, vendor payouts, and relief disbursements.
          </p>
        </div>

        {hasPermission("finance:manage") && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIncDesc("");
                setIncAmount("");
                setIncFrom("");
                setIncRef("");
                setIncNotes("");
                setIncomeModalOpen(true);
              }}
              icon={<ArrowUpRight className="w-4 h-4 text-emerald-500" />}
            >
              Add Income
            </Button>

            <Button
              variant="gold"
              onClick={() => {
                setExpCategoryId(expenseCategories[0]?.id ? String(expenseCategories[0].id) : "");
                setExpDesc("");
                setExpAmount("");
                setExpVendor("");
                setExpRef("");
                setExpNotes("");
                setExpenseModalOpen(true);
              }}
              icon={<ArrowDownRight className="w-4 h-4 text-rose-500" />}
            >
              Record Expense Voucher
            </Button>
          </div>
        )}
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-white to-emerald-50/40 dark:from-navy-900 dark:to-emerald-950/20 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Revenue Inflow</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalIncome)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Across all membership, sales, donations & fees</p>
        </div>

        <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-gradient-to-br from-white to-rose-50/40 dark:from-navy-900 dark:to-rose-950/20 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Operational Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(totalExpenses)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Office, payroll, library, & welfare disbursements</p>
        </div>

        <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-white to-amber-50/40 dark:from-navy-900 dark:to-amber-950/20 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Net Operating Balance</span>
            <Scale className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {formatCurrency(netBalance)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Net association surplus retained</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-navy-800 pb-2">
        <button
          onClick={() => setActiveTab("income")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "income"
              ? "bg-navy-800 text-white dark:bg-gold-500 dark:text-navy-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
          }`}
        >
          Income Register ({incomeTotalRecords})
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "expenses"
              ? "bg-navy-800 text-white dark:bg-gold-500 dark:text-navy-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
          }`}
        >
          Expense Vouchers ({expenseTotalRecords})
        </button>
      </div>

      {/* TAB 1: Income Register */}
      {activeTab === "income" && (
        <Card>
          <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search income by no, description, payer..."
                value={incomeSearch}
                onChange={(e) => {
                  setIncomeSearch(e.target.value);
                  setIncomePage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700/80 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={incomeCategory}
                onChange={(e) => {
                  setIncomeCategory(e.target.value);
                  setIncomePage(1);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Income Heads</option>
                <option value="membership_fee">Membership Fees</option>
                <option value="waqalatnama_sales">Waqalatnama Sales</option>
                <option value="form_sales">Form Sales</option>
                <option value="donation">Donations</option>
                <option value="other_income">Other Income</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/60 border-y border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Income No</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Category Head</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Received From</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold">Payment Mode</th>
                  <th className="py-3 px-4 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
                {loadingIncome ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading income register...
                    </td>
                  </tr>
                ) : incomes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No income records found.
                    </td>
                  </tr>
                ) : (
                  incomes.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                        {inc.income_no}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(inc.date)}</td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-800 dark:text-slate-200">
                        {inc.category ? String(inc.category).replace(/_/g, " ") : "Income"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {inc.description}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {inc.received_from || "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(inc.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {inc.payment_mode}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={inc.is_auto_generated ? "info" : "neutral"} size="sm">
                          {inc.is_auto_generated ? "System Source" : "Manual Direct"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={incomePage}
            totalPages={incomeTotalPages}
            totalRecords={incomeTotalRecords}
            pageSize={15}
            onPageChange={setIncomePage}
          />
        </Card>
      )}

      {/* TAB 2: Expense Register */}
      {activeTab === "expenses" && (
        <Card>
          <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search expense by no, payee, desc..."
                value={expenseSearch}
                onChange={(e) => {
                  setExpenseSearch(e.target.value);
                  setExpensePage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700/80 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={expenseCategory}
                onChange={(e) => {
                  setExpenseCategory(e.target.value);
                  setExpensePage(1);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Expense Categories</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/60 border-y border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Voucher No</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Payee / Vendor</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold">Mode & Ref</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
                {loadingExpenses ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading expense vouchers...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                        {exp.expense_no}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(exp.date)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {exp.category_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {exp.description}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {exp.payee_vendor}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400 text-sm">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div>{exp.payment_mode}</div>
                        {exp.reference_number && (
                          <div className="text-[10px] text-slate-400 font-mono">{exp.reference_number}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="success" size="sm">
                          {exp.payment_status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={expensePage}
            totalPages={expenseTotalPages}
            totalRecords={expenseTotalRecords}
            pageSize={15}
            onPageChange={setExpensePage}
          />
        </Card>
      )}

      {/* Record Income Modal */}
      <Modal
        isOpen={incomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
        title="Record Other Income / Credit Entry"
        subtitle="Post miscellaneous association revenue directly to the general ledger."
        size="md"
      >
        <form onSubmit={handleIncomeSubmit} className="space-y-4">
          <Input
            label="Income Description *"
            required
            placeholder="e.g. Legal Seminar Registration Fee / Hall Booking"
            value={incDesc}
            onChange={(e) => setIncDesc(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount (₹) *"
              type="number"
              required
              min="1"
              placeholder="e.g. 5000"
              value={incAmount}
              onChange={(e) => setIncAmount(e.target.value)}
            />
            <Select
              label="Account Head"
              value={incCategory}
              onChange={(e) => setIncCategory(e.target.value)}
              options={[
                { value: "other_income", label: "Other Income" },
                { value: "donation", label: "General Contribution" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Received From / Payer Name"
              placeholder="e.g. Shri S. K. Gupta"
              value={incFrom}
              onChange={(e) => setIncFrom(e.target.value)}
            />
            <Select
              label="Payment Mode"
              value={incMode}
              onChange={(e) => setIncMode(e.target.value)}
              options={[
                { value: "Cash", label: "Cash" },
                { value: "UPI", label: "UPI / QR" },
                { value: "Bank Transfer", label: "Bank Transfer" },
                { value: "Cheque", label: "Cheque" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Transaction Reference / Cheque No"
              placeholder="e.g. UPI/2026/0491"
              value={incRef}
              onChange={(e) => setIncRef(e.target.value)}
            />
            <Input
              label="Transaction Date"
              type="date"
              value={incDate}
              onChange={(e) => setIncDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIncomeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              loading={submittingIncome}
            >
              Post Income Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Expense Modal */}
      <Modal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Record Association Expense Voucher"
        subtitle="Record operational costs, staff honorarium, and infrastructure outlays."
        size="md"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Expense Category *
            </label>
            <select
              value={expCategoryId}
              onChange={(e) => setExpCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              required
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Expense Description *"
            required
            placeholder="e.g. Library journals & digital subscription renewal"
            value={expDesc}
            onChange={(e) => setExpDesc(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount (₹) *"
              type="number"
              required
              min="1"
              placeholder="e.g. 15000"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
            />
            <Input
              label="Payee / Vendor Name *"
              required
              placeholder="e.g. Eastern Book Company"
              value={expVendor}
              onChange={(e) => setExpVendor(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Payment Mode"
              value={expMode}
              onChange={(e) => setExpMode(e.target.value)}
              options={[
                { value: "Bank Transfer", label: "Bank Transfer / RTGS / NEFT" },
                { value: "Cheque", label: "Cheque" },
                { value: "UPI", label: "UPI" },
                { value: "Cash", label: "Cash" },
              ]}
            />
            <Input
              label="Bill / Invoice / UTR No"
              placeholder="e.g. INV-2026-8812"
              value={expRef}
              onChange={(e) => setExpRef(e.target.value)}
            />
          </div>

          <Input
            label="Date of Payment"
            type="date"
            value={expDate}
            onChange={(e) => setExpDate(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExpenseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              loading={submittingExpense}
            >
              Post Expense Voucher
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
