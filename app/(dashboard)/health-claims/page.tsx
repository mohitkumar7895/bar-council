"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Stethoscope,
  Search,
  Plus,
  CheckCircle,
  Clock,
  FileCheck,
  Building,
  DollarSign,
  Printer,
  ShieldCheck,
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

export default function HealthClaimsPage() {
  const { hasPermission } = useAuth();
  const { notify } = useNotification();

  const [claims, setClaims] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Advocates
  const [advocates, setAdvocates] = useState<any[]>([]);

  // New Claim Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAdvocateId, setSelectedAdvocateId] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [relationship, setRelationship] = useState("self");
  const [categoryId, setCategoryId] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("50000");
  const [hospitalName, setHospitalName] = useState("");
  const [illnessDetails, setIllnessDetails] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Review & Verify Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("under_review");
  const [verificationStatus, setVerificationStatus] = useState("verified");
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
    fetch("/api/health-claims/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      });

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
      const res = await fetch(`/api/health-claims?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setClaims(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalRecords(json.pagination.total);
      }
    } catch {
      notify.error("Failed to fetch health claims");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingClaim(true);

    try {
      const res = await fetch("/api/health-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advocate_id: Number(selectedAdvocateId),
          applicant_name: applicantName,
          relationship,
          category_id: categoryId ? Number(categoryId) : null,
          requested_amount: Number(requestedAmount),
          hospital_name: hospitalName,
          illness_details: illnessDetails,
          admission_date: admissionDate,
          discharge_date: dischargeDate,
          bank_name: bankName,
          account_number: accountNumber,
          ifsc_code: ifscCode,
          reviewer_remarks: remarks,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Claim submission failed");
        return;
      }

      notify.success("Health claim submitted successfully");
      const adv = advocates.find((a) => a.id === Number(selectedAdvocateId));
      const newClaimId = json.data?.claimId || Date.now();
      const newClaimNo = json.data?.claim_no || `HLC-${new Date().getFullYear()}-${newClaimId}`;
      setClaims((prev) => [
        {
          id: newClaimId,
          claim_no: newClaimNo,
          advocate_id: Number(selectedAdvocateId),
          applicant_name,
          advocate_name: adv?.full_name || "Advocate",
          advocate_code: adv?.advocate_code || "",
          category_name: "Hospitalization / Surgery",
          hospital_name: hospitalName,
          claimed_amount: Number(requestedAmount),
          sanctioned_amount: Number(requestedAmount),
          submission_date: new Date().toISOString().split("T")[0],
          claim_status: "submitted",
          payment_status: "pending",
        },
        ...prev,
      ]);
      setTotalRecords((prev) => prev + 1);
      setModalOpen(false);
      fetchClaims();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmittingReview(true);

    try {
      const res = await fetch(`/api/health-claims/${selectedClaim.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_status: newStatus,
          verification_status: verificationStatus,
          reviewer_remarks: reviewerRemarks,
          sanctioned_amount: newStatus === "approved" ? Number(sanctionedAmount) : null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Review update failed");
        return;
      }

      notify.success("Health claim reviewed and updated");
      setClaims((prev) =>
        prev.map((c) =>
          c.id === selectedClaim.id
            ? {
                ...c,
                claim_status: newStatus,
                verification_status: verificationStatus,
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
      const res = await fetch(`/api/health-claims/${claimToDisburse.id}/disburse`, {
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

      notify.success("Medical aid disbursed and recorded in expense ledger");
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
            <Stethoscope className="w-6 h-6 text-purple-500" />
            Advocate Health & Medical Claim Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review hospital bills, medical certificates, verify nominee eligibility, and disburse relief.
          </p>
        </div>

        {hasPermission("health_claims:manage") && (
          <Button
            variant="gold"
            onClick={() => {
              setSelectedAdvocateId(advocates[0]?.id ? String(advocates[0].id) : "");
              setApplicantName(advocates[0]?.full_name || "");
              setRelationship("self");
              setCategoryId(categories[0]?.id ? String(categories[0].id) : "");
              setRequestedAmount("50000");
              setHospitalName("");
              setIllnessDetails("");
              setAdmissionDate("");
              setDischargeDate("");
              setBankName("");
              setAccountNumber("");
              setIfscCode("");
              setRemarks("");
              setModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            File Health Claim
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
              placeholder="Search by claim no, patient or hospital..."
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
                <th className="py-3 px-4 font-semibold">Patient / Advocate</th>
                <th className="py-3 px-4 font-semibold">Category & Hospital</th>
                <th className="py-3 px-4 font-semibold">Submitted</th>
                <th className="py-3 px-4 font-semibold text-right">Requested</th>
                <th className="py-3 px-4 font-semibold text-right">Sanctioned</th>
                <th className="py-3 px-4 font-semibold">Verification</th>
                <th className="py-3 px-4 font-semibold">Claim Status</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading health claims...
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No health claims found.
                  </td>
                </tr>
              ) : (
                claims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                      {c.claim_no}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div>{c.applicant_name}</div>
                      <p className="text-[10px] text-slate-400">
                        {c.advocate_name} ({c.relationship})
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div>{c.hospital_name || "Medical Hospital"}</div>
                      <p className="text-[10px] text-slate-400">{c.category_name || "Medical Aid"}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(c.submission_date)}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(c.requested_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(c.sanctioned_amount) > 0 ? formatCurrency(c.sanctioned_amount) : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          c.verification_status === "verified"
                            ? "success"
                            : c.verification_status === "rejected"
                            ? "danger"
                            : "warning"
                        }
                        size="sm"
                      >
                        {c.verification_status}
                      </Badge>
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
                        {hasPermission("health_claims:approve") && c.claim_status !== "disbursed" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedClaim(c);
                              setNewStatus(c.claim_status);
                              setVerificationStatus(c.verification_status);
                              setReviewerRemarks(c.reviewer_remarks || "");
                              setSanctionedAmount(c.sanctioned_amount || c.requested_amount);
                              setReviewModalOpen(true);
                            }}
                            className="text-xs h-7 px-2"
                          >
                            Review / Verify
                          </Button>
                        )}

                        {hasPermission("health_claims:disburse") && c.claim_status === "approved" && (
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => {
                              setClaimToDisburse(c);
                              setDisbMode("Bank Transfer");
                              setDisbRefNo("");
                              setDisbRemarks(`Medical aid disbursed to ${c.applicant_name} (${c.bank_name || "Bank"})`);
                              setDisburseModalOpen(true);
                            }}
                            className="text-xs h-7 px-2"
                          >
                            Disburse
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

      {/* New Health Claim Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Submit Health / Medical Relief Application"
        subtitle="Bar Association Medical Aid for Advocates & Dependent Family Members."
        size="lg"
      >
        <form onSubmit={handleClaimSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Advocate Member *
              </label>
              <select
                value={selectedAdvocateId}
                onChange={(e) => {
                  setSelectedAdvocateId(e.target.value);
                  const adv = advocates.find((a) => String(a.id) === e.target.value);
                  if (adv && relationship === "self") setApplicantName(adv.full_name);
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
                required
              >
                {advocates.map((adv) => (
                  <option key={adv.id} value={adv.id}>
                    {adv.full_name} ({adv.advocate_code})
                  </option>
                ))}
              </select>
            </div>

            <Select
              label="Relationship to Member *"
              value={relationship}
              onChange={(e) => {
                setRelationship(e.target.value);
                if (e.target.value === "self") {
                  const adv = advocates.find((a) => String(a.id) === selectedAdvocateId);
                  if (adv) setApplicantName(adv.full_name);
                } else {
                  setApplicantName("");
                }
              }}
              options={[
                { value: "self", label: "Self (Advocate)" },
                { value: "spouse", label: "Spouse" },
                { value: "child", label: "Dependent Child" },
                { value: "parent", label: "Dependent Parent" },
                { value: "dependent", label: "Other Dependent" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Patient / Applicant Full Name *"
              required
              placeholder="e.g. Adv. Vikramaditya Chauhan"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Medical Claim Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Max: ₹{c.max_eligible_amount})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hospital / Medical Facility Name *"
              placeholder="e.g. Max Super Speciality Hospital"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
            />
            <Input
              label="Requested Claim Amount (₹) *"
              type="number"
              required
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
            />
          </div>

          <Input
            label="Diagnosis / Illness Details *"
            placeholder="e.g. Coronary Angioplasty / Surgical ICU stay..."
            value={illnessDetails}
            onChange={(e) => setIllnessDetails(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Admission Date"
              type="date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
            />
            <Input
              label="Discharge Date"
              type="date"
              value={dischargeDate}
              onChange={(e) => setDischargeDate(e.target.value)}
            />
          </div>

          {/* Bank details for disbursement */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950/40 space-y-3">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Beneficiary Bank Details for Direct Transfer
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Bank Name"
                placeholder="e.g. HDFC Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
              <Input
                label="Account Number"
                placeholder="e.g. 50100234129801"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
              <Input
                label="IFSC Code"
                placeholder="e.g. HDFC0000123"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
              />
            </div>
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
              loading={submittingClaim}
            >
              Submit Health Claim
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review & Verify Health Claim"
        subtitle={selectedClaim?.claim_no}
        size="md"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <Select
            label="Document Verification Checklist"
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value)}
            options={[
              { value: "pending", label: "Pending Document Verification" },
              { value: "in_progress", label: "In Progress / Committee Scrutiny" },
              { value: "verified", label: "Verified (All Hospital Bills & Rx Valid)" },
              { value: "rejected", label: "Rejected (Ineligible or Invalid Bills)" },
            ]}
          />

          <Select
            label="Workflow Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={[
              { value: "submitted", label: "Submitted" },
              { value: "under_review", label: "Under Review" },
              { value: "documents_pending", label: "Documents Pending (Awaiting Original Bills)" },
              { value: "approved", label: "Approved (Sanction Medical Aid)" },
              { value: "rejected", label: "Rejected" },
            ]}
          />

          {newStatus === "approved" && (
            <Input
              label="Sanctioned Medical Aid Amount (₹) *"
              type="number"
              required
              value={sanctionedAmount}
              onChange={(e) => setSanctionedAmount(e.target.value)}
            />
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Medical Welfare Committee Remarks *
            </label>
            <textarea
              rows={3}
              required
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="Medical committee findings, verified bill amounts, resolution details..."
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
              Update Claim Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Disburse Modal */}
      <Modal
        isOpen={disburseModalOpen}
        onClose={() => setDisburseModalOpen(false)}
        title="Disburse Health Claim Relief"
        subtitle={`Claim: ${claimToDisburse?.claim_no} • Sanctioned: ₹${claimToDisburse?.sanctioned_amount || claimToDisburse?.requested_amount}`}
        size="md"
      >
        <form onSubmit={handleDisburseSubmit} className="space-y-4">
          <Select
            label="Payment Mode"
            value={disbMode}
            onChange={(e) => setDisbMode(e.target.value)}
            options={[
              { value: "Bank Transfer", label: "Bank Transfer / NEFT / RTGS" },
              { value: "Cheque", label: "Cheque" },
              { value: "UPI", label: "UPI" },
            ]}
          />

          <Input
            label="Bank Transaction / UTR / Reference No. *"
            required
            placeholder="e.g. UTR-HDFC-9901824"
            value={disbRefNo}
            onChange={(e) => setDisbRefNo(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Voucher Notes
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="Beneficiary account reference and committee disbursement remarks..."
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
