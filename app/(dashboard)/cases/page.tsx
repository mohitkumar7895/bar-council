"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Search,
  Plus,
  Scale,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";

export default function CasesPage() {
  const { hasPermission } = useAuth();
  const { notify } = useNotification();

  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Advocates
  const [advocates, setAdvocates] = useState<any[]>([]);

  // Register Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [refNo, setRefNo] = useState("");
  const [category, setCategory] = useState("general_grievance");
  const [applicantName, setApplicantName] = useState("");
  const [respondentName, setRespondentName] = useState("");
  const [selectedAdvocateId, setSelectedAdvocateId] = useState("");
  const [filingDate, setFilingDate] = useState(new Date().toISOString().split("T")[0]);
  const [presidingOfficer, setPresidingOfficer] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit / Outcome Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("pending");
  const [editOfficer, setEditOfficer] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editOutcome, setEditOutcome] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch("/api/advocates?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAdvocates(d.data);
      });
  }, []);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search,
        category: categoryFilter,
        status: statusFilter,
      });
      const res = await fetch(`/api/cases?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCases(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalRecords(json.pagination.total);
      }
    } catch {
      notify.error("Failed to load cases register");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference_number: refNo,
          category,
          applicant_name: applicantName,
          respondent_name: respondentName,
          advocate_id: selectedAdvocateId ? Number(selectedAdvocateId) : null,
          filing_date: filingDate,
          presiding_officer: presidingOfficer,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Failed to register case");
        return;
      }

      notify.success("Case registered successfully");
      setModalOpen(false);
      fetchCases();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setUpdating(true);

    try {
      const res = await fetch(`/api/cases/${selectedCase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          presiding_officer: editOfficer,
          notes: editNotes,
          outcome: editOutcome,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Update failed");
        return;
      }

      notify.success("Case updated successfully");
      setEditModalOpen(false);
      fetchCases();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-gold-500" />
            Association Disputes & Grievance Register
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official Bar Association register for chamber allocations, disciplinary matters, conciliation, and appeals.
          </p>
        </div>

        {hasPermission("cases:manage") && (
          <Button
            variant="gold"
            onClick={() => {
              setRefNo(`REF/BAR/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
              setCategory("general_grievance");
              setApplicantName("");
              setRespondentName("");
              setSelectedAdvocateId("");
              setPresidingOfficer("President, Bar Association");
              setNotes("");
              setModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Register Matter
          </Button>
        )}
      </div>

      <Card>
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by case no, ref, or applicant..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700/80 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="disciplinary">Disciplinary</option>
              <option value="dispute">Chamber / Space Dispute</option>
              <option value="welfare_appeal">Welfare Relief Appeal</option>
              <option value="arbitration">Arbitration</option>
              <option value="general_grievance">General Grievance</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="hearing">Hearing</option>
              <option value="adjourned">Adjourned</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950/60 border-y border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Case ID</th>
                <th className="py-3 px-4 font-semibold">Reference No</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Parties / Applicant</th>
                <th className="py-3 px-4 font-semibold">Advocate</th>
                <th className="py-3 px-4 font-semibold">Filing Date</th>
                <th className="py-3 px-4 font-semibold">Presiding Officer</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading cases...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No cases or dispute records found.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                      {c.case_no}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">
                      {c.reference_number}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <Badge variant="neutral" size="sm">
                        {c.category.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      <div>{c.applicant_name}</div>
                      {c.respondent_name && (
                        <p className="text-[10px] text-slate-400">vs. {c.respondent_name}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {c.advocate_name || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(c.filing_date)}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {c.presiding_officer || "Bar Committee"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          c.status === "resolved"
                            ? "success"
                            : c.status === "dismissed"
                            ? "danger"
                            : c.status === "hearing"
                            ? "info"
                            : "warning"
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasPermission("cases:manage") && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedCase(c);
                            setEditStatus(c.status);
                            setEditOfficer(c.presiding_officer || "");
                            setEditNotes(c.notes || "");
                            setEditOutcome(c.outcome || "");
                            setEditModalOpen(true);
                          }}
                          className="text-xs h-7 px-2"
                        >
                          Update / Hearing
                        </Button>
                      )}
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

      {/* Register Case Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register Association Grievance / Case"
        subtitle="Maintain formal record of complaints, disputes, and arbitration."
        size="md"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <Input
            label="Reference / Diary Number *"
            required
            placeholder="e.g. REF/BAR/2026/01"
            value={refNo}
            onChange={(e) => setRefNo(e.target.value)}
          />

          <Select
            label="Category *"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: "general_grievance", label: "General Grievance" },
              { value: "disciplinary", label: "Disciplinary Matter" },
              { value: "dispute", label: "Chamber / Seat Space Dispute" },
              { value: "welfare_appeal", label: "Welfare Relief Appeal" },
              { value: "arbitration", label: "Arbitration / Conciliation" },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Applicant / Complainant *"
              required
              placeholder="e.g. Adv. R. K. Mittal"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
            />
            <Input
              label="Respondent / Opposite Party"
              placeholder="e.g. Welfare Committee"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Concerned Advocate (Optional)
            </label>
            <select
              value={selectedAdvocateId}
              onChange={(e) => setSelectedAdvocateId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
            >
              <option value="">-- None / General Matter --</option>
              {advocates.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.full_name} ({adv.advocate_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Filing Date"
              type="date"
              value={filingDate}
              onChange={(e) => setFilingDate(e.target.value)}
            />
            <Input
              label="Presiding Officer"
              placeholder="e.g. President, DBA"
              value={presidingOfficer}
              onChange={(e) => setPresidingOfficer(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Case Brief / Grievance Summary
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="Grievance subject, chamber dispute details, or appeal grounds..."
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
              Register Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update / Outcome Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Update Case Status & Hearing Outcome"
        subtitle={selectedCase?.case_no}
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Select
            label="Hearing Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            options={[
              { value: "pending", label: "Pending" },
              { value: "hearing", label: "Under Active Hearing" },
              { value: "adjourned", label: "Adjourned" },
              { value: "resolved", label: "Resolved (Dispute Settled)" },
              { value: "dismissed", label: "Dismissed" },
            ]}
          />

          <Input
            label="Presiding Officer / Bench"
            value={editOfficer}
            onChange={(e) => setEditOfficer(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hearing Proceedings & Notes
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Final Decision / Outcome Order
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="e.g. Penalty waived, or chamber space reassigned..."
              value={editOutcome}
              onChange={(e) => setEditOutcome(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={updating}
            >
              Save Proceedings
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
