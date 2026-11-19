"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  DollarSign,
  AlertTriangle,
  Building,
  ArrowRight,
  Eye,
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

export default function DeathBenefitPage() {
  const { hasPermission } = useAuth();
  const { notify } = useNotification();

  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Advocates
  const [advocates, setAdvocates] = useState<any[]>([]);

  // Register Modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedAdvocateId, setSelectedAdvocateId] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [relationship, setRelationship] = useState("Spouse / Nominee");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("500000");
  const [remarks, setRemarks] = useState("");
  const [submittingRegister, setSubmittingRegister] = useState(false);

  // Review / Status Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("under_review");
  const [reviewerRemarks, setReviewerRemarks] = useState("");
  const [sanctionedAmount, setSanctionedAmount] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Disburse Modal
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [claimToDisburse, setClaimToDisburse] = useState<any>(null);
  const [disbMode, setDisbMode] = useState("Bank Transfer");
  const [disbRefNo, setDisbRefNo] = useState("");
  const [disbRemarks, setDisbRemarks] = useState("");
  const [submittingDisburse, setSubmittingDisburse] = useState(false);

  useEffect(() => {
    fetch("/api/advocates?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAdvocates(d.data);
      });
  }, []);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search,
        status: statusFilter,
      });
      const res = await fetch(`/api/death-benefit?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setClaims(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalRecords(json.pagination.total);
      }
    } catch {
      notify.error("Failed to fetch death benefit claims");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRegister(true);

    try {
      const res = await fetch("/api/death-benefit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advocate_id: Number(selectedAdvocateId),
          date_of_death: dateOfDeath,
          applicant_name: applicantName,
          relationship,
          phone,
          email,
          address,
          requested_amount: Number(requestedAmount),
          reviewer_remarks: remarks,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Claim registration failed");
        return;
      }

      notify.success("Death Benefit Claim registered successfully");
      const adv = advocates.find((a) => a.id === Number(selectedAdvocateId));
      const newClaimId = json.data?.claimId || Date.now();
      const newClaimNo = json.data?.claim_no || `DBC-${new Date().getFullYear()}-${newClaimId}`;
      setClaims((prev) => [
        {
          id: newClaimId,
          claim_no: newClaimNo,
          advocate_id: Number(selectedAdvocateId),
          deceased_advocate_name: adv?.full_name || "Advocate",
          advocate_name: adv?.full_name || "Advocate",
          advocate_code: adv?.advocate_code || "",
          applicant_name,
          relationship,
          phone,
          date_of_death: dateOfDeath,
          application_date: new Date().toISOString().split("T")[0],
          sanctioned_amount: Number(requestedAmount),
          requested_amount: Number(requestedAmount),
          claim_status: "submitted",
          payment_status: "pending",
        },
        ...prev,
      ]);
      setTotalRecords((prev) => prev + 1);
      setRegisterModalOpen(false);
      fetchClaims();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setSubmittingRegister(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmittingReview(true);

    try {
      const res = await fetch(`/api/death-benefit/${selectedClaim.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_status: newStatus,
          reviewer_remarks: reviewerRemarks,
          sanctioned_amount: newStatus === "approved" ? Number(sanctionedAmount) : null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Review update failed");
        return;
      }

      notify.success("Claim status updated successfully");
      setClaims((prev) =>
        prev.map((c) =>
          c.id === selectedClaim.id
            ? {
                ...c,
                claim_status: newStatus,
                reviewer_remarks: reviewerRemarks,
                sanctioned_amount: newStatus === "approved" ? Number(sanctionedAmount) : c.sanctioned_amount,
              }
            : c
        )
      );
      setReviewModalOpen(false);
      fetchClaims();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimToDisburse) return;
    setSubmittingDisburse(true);

    try {
      const res = await fetch(`/api/death-benefit/${claimToDisburse.id}/disburse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_mode: disbMode,
          bank_reference_no: disbRefNo,
          disbursement_remarks: disbRemarks,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Disbursement failed");
        return;
      }

      notify.success("Claim disbursed and posted to financial expense ledger!");
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimToDisburse.id
            ? { ...c, claim_status: "disbursed", payment_status: "disbursed" }
            : c
        )
      );
      setDisburseModalOpen(false);
      fetchClaims();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setSubmittingDisburse(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            Death Benefit Fund Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            5-Stage approval workflow for deceased advocate nominee relief and fund disbursements.
          </p>
        </div>

        {hasPermission("death_benefit:manage") && (
          <Button
            variant="gold"
            onClick={() => {
              setSelectedAdvocateId(advocates[0]?.id ? String(advocates[0].id) : "");
              setDateOfDeath(new Date().toISOString().split("T")[0]);
              setApplicantName("");
              setPhone("");
              setEmail("");
              setAddress("");
              setRequestedAmount("500000");
              setRemarks("");
              setRegisterModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Register Death Claim
          </Button>
        )}
      </div>

      {/* Filter and Workflow Tabs */}
      <Card>
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by claim no, deceased advocate or nominee..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700/80 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs">
            {[
              { id: "all", label: "All" },
              { id: "submitted", label: "Submitted" },
              { id: "under_review", label: "Under Review" },
              { id: "documents_pending", label: "Docs Pending" },
              { id: "approved", label: "Approved" },
              { id: "disbursed", label: "Disbursed" },
              { id: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  statusFilter === tab.id
                    ? "bg-navy-800 text-white dark:bg-gold-500 dark:text-navy-950 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Claims Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950/60 border-y border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Claim ID</th>
                <th className="py-3 px-4 font-semibold">Deceased Advocate</th>
                <th className="py-3 px-4 font-semibold">Nominee / Applicant</th>
                <th className="py-3 px-4 font-semibold">Demise Date</th>
                <th className="py-3 px-4 font-semibold text-right">Requested</th>
                <th className="py-3 px-4 font-semibold text-right">Sanctioned</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading claims records...
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No death benefit claims found under this status.
                  </td>
                </tr>
              ) : (
                claims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                      {c.claim_no}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div>{c.deceased_advocate_name}</div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {c.membership_no} • {c.registration_no}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                      <div>{c.applicant_name}</div>
                      <p className="text-[10px] text-slate-400">{c.relationship} • {c.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(c.date_of_death)}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(c.requested_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(c.sanctioned_amount) > 0 ? formatCurrency(c.sanctioned_amount) : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          c.claim_status === "disbursed"
                            ? "success"
                            : c.claim_status === "approved"
                            ? "info"
                            : c.claim_status === "rejected"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {c.claim_status ? String(c.claim_status).replace(/_/g, " ") : "Submitted"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {hasPermission("death_benefit:approve") && c.claim_status !== "disbursed" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedClaim(c);
                              setNewStatus(c.claim_status);
                              setReviewerRemarks(c.reviewer_remarks || "");
                              setSanctionedAmount(c.sanctioned_amount || c.requested_amount);
                              setReviewModalOpen(true);
                            }}
                            className="text-xs h-7 px-2"
                          >
                            Review / Approve
                          </Button>
                        )}

                        {hasPermission("death_benefit:disburse") && c.claim_status === "approved" && (
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => {
                              setClaimToDisburse(c);
                              setDisbMode("Bank Transfer");
                              setDisbRefNo("");
                              setDisbRemarks(`Disbursed to nominee ${c.applicant_name} via RTGS`);
                              setDisburseModalOpen(true);
                            }}
                            className="text-xs h-7 px-2"
                          >
                            Disburse Funds
                          </Button>
                        )}

                        {c.claim_status === "disbursed" && (
                          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-mono">
                            UTR: {c.bank_reference_no}
                          </span>
                        )}
                      </div>
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

      {/* Register Claim Modal */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Register Death Benefit Claim Application"
        subtitle="Nominee claim for Bar Association welfare demise relief."
        size="lg"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Deceased Advocate *
            </label>
            <select
              value={selectedAdvocateId}
              onChange={(e) => setSelectedAdvocateId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              required
            >
              {advocates.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.full_name} ({adv.advocate_code} • {adv.bar_council_reg_no})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Death *"
              type="date"
              required
              value={dateOfDeath}
              onChange={(e) => setDateOfDeath(e.target.value)}
            />
            <Input
              label="Requested Relief Amount (₹) *"
              type="number"
              required
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Applicant / Nominee Full Name *"
              required
              placeholder="e.g. Smt. Sushila Dave"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
            />
            <Input
              label="Relationship with Deceased *"
              required
              placeholder="e.g. Spouse / Son / Daughter"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nominee Phone Number *"
              required
              placeholder="e.g. +91 9811122334"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="Nominee Email"
              type="email"
              placeholder="e.g. nominee@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Input
            label="Residential Address of Applicant"
            placeholder="Address for correspondence and legal notice..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Initial Remarks / Document Checklist Status
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="e.g. Death certificate, identity proof, and succession documents attached..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRegisterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              loading={submittingRegister}
            >
              Register Claim Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review / Status Change Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Death Benefit Application"
        subtitle={selectedClaim?.claim_no}
        size="md"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <Select
            label="Update Application Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={[
              { value: "submitted", label: "Submitted" },
              { value: "under_review", label: "Under Review" },
              { value: "documents_pending", label: "Documents Pending (Clarification Required)" },
              { value: "approved", label: "Approved (Sanction Relief)" },
              { value: "rejected", label: "Rejected" },
            ]}
          />

          {newStatus === "approved" && (
            <Input
              label="Sanctioned Relief Amount (₹) *"
              type="number"
              required
              value={sanctionedAmount}
              onChange={(e) => setSanctionedAmount(e.target.value)}
            />
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Committee Reviewer Remarks *
            </label>
            <textarea
              rows={3}
              required
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="Review findings, resolution number, or reason for rejection/clarification..."
              value={reviewerRemarks}
              onChange={(e) => setReviewerRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submittingReview}
            >
              Save Review Decision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Disburse Funds Modal */}
      <Modal
        isOpen={disburseModalOpen}
        onClose={() => setDisburseModalOpen(false)}
        title="Disburse Death Benefit Relief"
        subtitle={`Claim: ${claimToDisburse?.claim_no} • Sanctioned: ₹${claimToDisburse?.sanctioned_amount || claimToDisburse?.requested_amount}`}
        size="md"
      >
        <form onSubmit={handleDisburseSubmit} className="space-y-4">
          <Select
            label="Payment Mode"
            value={disbMode}
            onChange={(e) => setDisbMode(e.target.value)}
            options={[
              { value: "Bank Transfer", label: "Bank Transfer / RTGS / NEFT" },
              { value: "Cheque", label: "Official Cheque" },
              { value: "Demand Draft", label: "Demand Draft (DD)" },
            ]}
          />

          <Input
            label="Bank Transaction / UTR / Cheque Reference No. *"
            required
            placeholder="e.g. UTR-SBI-2026-9041289"
            value={disbRefNo}
            onChange={(e) => setDisbRefNo(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Disbursement Voucher Remarks
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="Beneficiary account details and voucher notes..."
              value={disbRemarks}
              onChange={(e) => setDisbRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDisburseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              loading={submittingDisburse}
            >
              Confirm Disbursement & Post to Expenses
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
