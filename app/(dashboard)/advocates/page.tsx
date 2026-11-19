"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Printer,
  FileText,
  CreditCard,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Download,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { Advocate } from "@/types";

export default function AdvocatesPage() {
  const { hasPermission } = useAuth();
  const { notify } = useNotification();

  // State
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Form Modal (Add / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdvocate, setEditingAdvocate] = useState<Advocate | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Profile View Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [viewingAdvocate, setViewingAdvocate] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<"bio" | "ledger" | "sales" | "claims">("bio");

  // Delete Confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [advocateToDelete, setAdvocateToDelete] = useState<Advocate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    full_name: "",
    father_name: "",
    address: "",
    phone: "",
    email: "",
    bar_council_reg_no: "",
    association_membership_no: "",
    kalyan_nidhi_no: "",
    apda_kosh_details: "",
    membership_start_date: new Date().toISOString().split("T")[0],
    renewal_date: "",
    membership_status: "active",
    admission_fee: 5000,
    monthly_chanda: 100,
    annual_dues: 1200,
    remarks: "",
  });

  const fetchAdvocates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search,
        status: statusFilter,
      });
      const res = await fetch(`/api/advocates?${params.toString()}`);
      const json = await res.json();
      if (json.unauthenticated) {
        window.location.href = "/login";
        return;
      }
      if (json.success) {
        setAdvocates(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalRecords(json.pagination.total);
      }
    } catch (err) {
      notify.error("Failed to load advocate directory");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchAdvocates();
  }, [fetchAdvocates]);

  const handleOpenAddModal = () => {
    setEditingAdvocate(null);
    setFormData({
      full_name: "",
      father_name: "",
      address: "",
      phone: "",
      email: "",
      bar_council_reg_no: "",
      association_membership_no: "",
      kalyan_nidhi_no: "",
      apda_kosh_details: "",
      membership_start_date: new Date().toISOString().split("T")[0],
      renewal_date: "",
      membership_status: "active",
      admission_fee: 5000,
      monthly_chanda: 100,
      annual_dues: 1200,
      remarks: "",
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (adv: Advocate) => {
    setEditingAdvocate(adv);
    setFormData({
      full_name: adv.full_name,
      father_name: adv.father_name,
      address: adv.address || "",
      phone: adv.phone,
      email: adv.email || "",
      bar_council_reg_no: adv.bar_council_reg_no,
      association_membership_no: adv.association_membership_no,
      kalyan_nidhi_no: adv.kalyan_nidhi_no || "",
      apda_kosh_details: adv.apda_kosh_details || "",
      membership_start_date: adv.membership_start_date ? adv.membership_start_date.split("T")[0] : "",
      renewal_date: adv.renewal_date ? adv.renewal_date.split("T")[0] : "",
      membership_status: adv.membership_status,
      admission_fee: adv.admission_fee || 5000,
      monthly_chanda: adv.monthly_chanda || 100,
      annual_dues: adv.annual_dues || 1200,
      remarks: adv.remarks || "",
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      notify.error("Phone / Mobile Number must be exactly 10 digits");
      return;
    }

    setFormSubmitting(true);

    try {
      const url = editingAdvocate ? `/api/advocates/${editingAdvocate.id}` : "/api/advocates";
      const method = editingAdvocate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Action failed");
        return;
      }

      notify.success(
        editingAdvocate
          ? "Advocate record updated successfully"
          : "Advocate successfully enrolled into the Association"
      );

      // Optimistic instant UI update
      if (editingAdvocate) {
        setAdvocates((prev) =>
          prev.map((a) =>
            a.id === editingAdvocate.id
              ? ({ ...a, ...formData, membership_status: formData.membership_status as any } as Advocate)
              : a
          )
        );
      } else {
        const newId = json.data?.advocateId || Date.now();
        const code = json.data?.advocate_code || `ADV-${new Date().getFullYear()}-${String(newId).padStart(4, "0")}`;
        const newEntry: Advocate = {
          id: newId,
          advocate_code: code,
          full_name: formData.full_name,
          father_name: formData.father_name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          bar_council_reg_no: formData.bar_council_reg_no,
          association_membership_no: formData.association_membership_no,
          kalyan_nidhi_no: formData.kalyan_nidhi_no,
          apda_kosh_details: formData.apda_kosh_details,
          membership_start_date: formData.membership_start_date,
          renewal_date: formData.renewal_date,
          membership_status: formData.membership_status as any,
          admission_fee: formData.admission_fee,
          monthly_chanda: formData.monthly_chanda,
          annual_dues: formData.annual_dues,
          outstanding_amount: formData.annual_dues,
          total_paid: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setAdvocates((prev) => [newEntry, ...prev.filter((a) => a.id !== newId)]);
        setTotalRecords((prev) => prev + 1);
      }

      setModalOpen(false);
      fetchAdvocates();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleViewProfile = async (id: number) => {
    setProfileLoading(true);
    setProfileModalOpen(true);
    setActiveProfileTab("bio");
    try {
      const res = await fetch(`/api/advocates/${id}`);
      const json = await res.json();
      if (json.unauthenticated) {
        window.location.href = "/login";
        return;
      }
      if (json.success) {
        setViewingAdvocate(json.data);
      } else {
        notify.error("Failed to load advocate details");
      }
    } catch {
      notify.error("Error fetching advocate details");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!advocateToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/advocates/${advocateToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.unauthenticated) {
        window.location.href = "/login";
        return;
      }
      if (json.success) {
        notify.success(json.message || "Advocate deleted");
        setDeleteConfirmOpen(false);
        fetchAdvocates();
      } else {
        notify.error(json.error || "Deletion failed");
      }
    } catch {
      notify.error("Network error deleting advocate");
    } finally {
      setDeleteLoading(false);
    }
  };

  const printProfile = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-gold-500" />
            Advocate Directory & Roll
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain registered bar members, enrollment credentials, Kalyan Nidhi welfare, and fee ledgers.
          </p>
        </div>

        {hasPermission("advocates:create") && (
          <Button
            variant="gold"
            onClick={handleOpenAddModal}
            icon={<Plus className="w-4 h-4" />}
          >
            Register Advocate
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, Bar Reg No, or Membership ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700/80 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs">
            {["all", "active", "inactive", "suspended", "deceased"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  statusFilter === st
                    ? "bg-navy-800 text-white dark:bg-gold-500 dark:text-navy-950 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Table */}
        <div className="table-wrapper overflow-x-auto" tabIndex={0} role="region" aria-label="Advocates directory table">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-navy-950/95 backdrop-blur-md border-y border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-300 shadow-sm">
              <tr>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Advocate ID</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Advocate Name</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Bar Council Reg</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Membership No</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Kalyan Nidhi</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Phone & Email</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px]">Status</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px] text-right">Outstanding</th>
                <th className="py-3.5 px-4 font-bold tracking-wider uppercase text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs">Loading advocate records from database...</p>
                  </td>
                </tr>
              ) : advocates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No advocates matching your search or filters found.
                  </td>
                </tr>
              ) : (
                advocates.map((adv) => (
                  <tr
                    key={adv.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-gold-400">
                      {adv.advocate_code}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      <div>
                        <span className="font-semibold">{adv.full_name}</span>
                        <p className="text-[10px] text-slate-400">S/o: {adv.father_name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {adv.bar_council_reg_no}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {adv.association_membership_no}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {adv.kalyan_nidhi_no || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{adv.phone}</div>
                      {adv.email && <div className="text-[10px] text-slate-400">{adv.email}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          adv.membership_status === "active"
                            ? "success"
                            : adv.membership_status === "deceased"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {adv.membership_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {Number(adv.outstanding_amount) > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400">
                          {formatCurrency(adv.outstanding_amount)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">Cleared</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleViewProfile(adv.id)}
                          title="View Profile & Ledger"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 dark:hover:text-gold-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {hasPermission("advocates:edit") && (
                          <button
                            onClick={() => handleOpenEditModal(adv)}
                            title="Edit Advocate"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {hasPermission("advocates:delete") && (
                          <button
                            onClick={() => {
                              setAdvocateToDelete(adv);
                              setDeleteConfirmOpen(true);
                            }}
                            title="Delete or Archive Advocate"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Add / Edit Advocate Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAdvocate ? "Update Advocate Record" : "Enroll New Advocate"}
        subtitle="Ensure Bar Council registration numbers match official state certificates."
        size="xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name of Advocate"
              required
              placeholder="e.g. Adv. Rajeshwar Sharma"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />

            <Input
              label="Father's / Guardian's Name (S/o, D/o)"
              required
              placeholder="e.g. Shri K. L. Sharma"
              value={formData.father_name}
              onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
            />

            <Input
              label="Bar Council Registration No."
              required
              placeholder="e.g. D/1420/1998"
              value={formData.bar_council_reg_no}
              onChange={(e) => setFormData({ ...formData, bar_council_reg_no: e.target.value })}
            />

            <Input
              label="Association Membership No."
              required
              placeholder="e.g. BAR-M-1042"
              value={formData.association_membership_no}
              onChange={(e) => setFormData({ ...formData, association_membership_no: e.target.value })}
            />

            <Input
              label="Phone / Mobile Number"
              required
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="e.g. 9876543210 (10 digits)"
              value={formData.phone}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                setFormData({ ...formData, phone: numericOnly });
              }}
              helperText={
                formData.phone.length > 0 && formData.phone.length < 10
                  ? `${formData.phone.length}/10 digits entered (10 required)`
                  : undefined
              }
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. advocate@delhibar.org"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Kalyan Nidhi Number"
              placeholder="e.g. KN-9801"
              value={formData.kalyan_nidhi_no}
              onChange={(e) => setFormData({ ...formData, kalyan_nidhi_no: e.target.value })}
            />

            <Input
              label="Apda Kosh Details / Scheme"
              placeholder="e.g. State Bar Apda Relief Scheme"
              value={formData.apda_kosh_details}
              onChange={(e) => setFormData({ ...formData, apda_kosh_details: e.target.value })}
            />

            <Input
              label="Membership Start Date"
              type="date"
              required
              value={formData.membership_start_date}
              onChange={(e) => setFormData({ ...formData, membership_start_date: e.target.value })}
            />

            <Input
              label="Renewal Validity Date"
              type="date"
              value={formData.renewal_date}
              onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
            />

            <Select
              label="Membership Status"
              value={formData.membership_status}
              onChange={(e) => setFormData({ ...formData, membership_status: e.target.value })}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "suspended", label: "Suspended" },
                { value: "deceased", label: "Deceased" },
              ]}
            />

            <Input
              label="Monthly Chanda Rate (₹)"
              type="number"
              value={formData.monthly_chanda}
              onChange={(e) => setFormData({ ...formData, monthly_chanda: Number(e.target.value) })}
            />

            <Input
              label="Annual Dues Rate (₹)"
              type="number"
              value={formData.annual_dues}
              onChange={(e) => setFormData({ ...formData, annual_dues: Number(e.target.value) })}
            />

            <Input
              label="Admission / Enrollment Fee (₹)"
              type="number"
              value={formData.admission_fee}
              onChange={(e) => setFormData({ ...formData, admission_fee: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Address / Chamber Details
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="Chamber No, Court complex or residential address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Administrative Remarks / Specialization
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="e.g. Civil and Criminal trial advocate, life member..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
              loading={formSubmitting}
            >
              {editingAdvocate ? "Update Record" : "Enroll Advocate"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Profile & Ledger View Modal (Printable) */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Advocate Master Profile"
        subtitle={viewingAdvocate?.advocate?.full_name}
        size="2xl"
      >
        {profileLoading || !viewingAdvocate ? (
          <div className="py-16 text-center text-slate-400">
            <div className="inline-block w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs">Fetching advocate profile, ledgers, and claim history...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between no-print border-b border-slate-100 dark:border-navy-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveProfileTab("bio")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeProfileTab === "bio"
                      ? "bg-navy-800 text-white dark:bg-gold-500 dark:text-navy-950"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
                  }`}
                >
                  Profile Bio
                </button>
                <button
                  onClick={() => setActiveProfileTab("ledger")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeProfileTab === "ledger"
                      ? "bg-navy-800 text-white dark:bg-gold-500 dark:text-navy-950"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
                  }`}
                >
                  Membership Dues & Ledger ({viewingAdvocate.dues?.length || 0})
                </button>
                <button
                  onClick={() => setActiveProfileTab("sales")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeProfileTab === "sales"
                      ? "bg-navy-800 text-white dark:bg-gold-500 dark:text-navy-950"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
                  }`}
                >
                  Waqalatnama Sales ({viewingAdvocate.sales?.length || 0})
                </button>
                <button
                  onClick={() => setActiveProfileTab("claims")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeProfileTab === "claims"
                      ? "bg-navy-800 text-white dark:bg-gold-500 dark:text-navy-950"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
                  }`}
                >
                  Welfare Claims ({(viewingAdvocate.claims?.death?.length || 0) + (viewingAdvocate.claims?.health?.length || 0)})
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={printProfile}
                icon={<Printer className="w-3.5 h-3.5" />}
              >
                Print Profile
              </Button>
            </div>

            {/* TAB: Bio & Card */}
            {activeProfileTab === "bio" && (
              <div className="space-y-6">
                {/* ID Card View */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 border-2 border-gold-500/60 text-white shadow-xl relative overflow-hidden print-break-inside">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-navy-700/60 pb-4">
                    <div>
                      <h4 className="text-base font-black tracking-wide text-gold-400">
                        BAR ASSOCIATION ENROLMENT CARD
                      </h4>
                      <p className="text-[10px] uppercase tracking-wider text-slate-300">
                        High Court & District Court Bar Association
                      </p>
                    </div>
                    <Badge variant="gold" size="md">
                      {viewingAdvocate.advocate.advocate_code}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Advocate Name</p>
                      <p className="text-sm font-bold text-white">{viewingAdvocate.advocate.full_name}</p>
                      <p className="text-xs text-slate-300">S/o: {viewingAdvocate.advocate.father_name}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Bar Registration</p>
                      <p className="text-sm font-bold text-gold-300">{viewingAdvocate.advocate.bar_council_reg_no}</p>
                      <p className="text-xs text-slate-300">Mem No: {viewingAdvocate.advocate.association_membership_no}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Welfare & Status</p>
                      <p className="text-xs font-semibold text-white">KN: {viewingAdvocate.advocate.kalyan_nidhi_no || "N/A"}</p>
                      <p className="text-xs capitalize text-emerald-400">Status: {viewingAdvocate.advocate.membership_status}</p>
                    </div>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950/40 space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200">Contact & Address</h5>
                    <p><span className="text-slate-400">Phone:</span> {viewingAdvocate.advocate.phone}</p>
                    <p><span className="text-slate-400">Email:</span> {viewingAdvocate.advocate.email || "Not Provided"}</p>
                    <p><span className="text-slate-400">Chamber / Address:</span> {viewingAdvocate.advocate.address || "Bar Association Room"}</p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950/40 space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200">Enrolment & Welfare Schemes</h5>
                    <p><span className="text-slate-400">Enrolled On:</span> {formatDate(viewingAdvocate.advocate.membership_start_date)}</p>
                    <p><span className="text-slate-400">Renewal Date:</span> {formatDate(viewingAdvocate.advocate.renewal_date)}</p>
                    <p><span className="text-slate-400">Apda Kosh:</span> {viewingAdvocate.advocate.apda_kosh_details || "Standard State Cover"}</p>
                    <p><span className="text-slate-400">Remarks:</span> {viewingAdvocate.advocate.remarks || "Regular Bar Member"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Ledger */}
            {activeProfileTab === "ledger" && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-200 dark:border-navy-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Period</th>
                        <th className="py-2.5 px-3">Due Type</th>
                        <th className="py-2.5 px-3">Month / Year</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Paid</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                      {viewingAdvocate.dues?.map((d: any) => (
                        <tr key={d.id}>
                          <td className="py-2 px-3 font-semibold">{d.period_name || d.due_year}</td>
                          <td className="py-2 px-3 capitalize">{d.due_type ? String(d.due_type).replace(/_/g, " ") : "Annual Dues"}</td>
                          <td className="py-2 px-3">{d.due_month ? `Month ${d.due_month} / ${d.due_year}` : `Year ${d.due_year}`}</td>
                          <td className="py-2 px-3 font-semibold">{formatCurrency(d.amount)}</td>
                          <td className="py-2 px-3 text-emerald-600">{formatCurrency(d.paid_amount)}</td>
                          <td className="py-2 px-3">
                            <Badge variant={d.status === "paid" ? "success" : "danger"} size="sm">
                              {d.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: Sales */}
            {activeProfileTab === "sales" && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-200 dark:border-navy-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Sale No</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Items Purchased</th>
                        <th className="py-2.5 px-3">Total Amount</th>
                        <th className="py-2.5 px-3">Mode</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                      {viewingAdvocate.sales?.map((s: any) => (
                        <tr key={s.id}>
                          <td className="py-2 px-3 font-mono font-semibold text-amber-600">{s.sale_no}</td>
                          <td className="py-2 px-3">{formatDate(s.sale_date)}</td>
                          <td className="py-2 px-3">{s.items_summary || "Waqalatnama copies"}</td>
                          <td className="py-2 px-3 font-bold">{formatCurrency(s.amount_received)}</td>
                          <td className="py-2 px-3">{s.payment_mode}</td>
                          <td className="py-2 px-3">
                            <Badge variant={s.payment_status === "paid" ? "success" : "warning"} size="sm">
                              {s.payment_status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: Claims */}
            {activeProfileTab === "claims" && (
              <div className="space-y-4">
                <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">Death & Health Welfare Claims</h5>
                <div className="overflow-x-auto border border-slate-200 dark:border-navy-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Claim No</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Applicant</th>
                        <th className="py-2.5 px-3">Requested</th>
                        <th className="py-2.5 px-3">Sanctioned</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                      {viewingAdvocate.claims?.health?.map((hc: any) => (
                        <tr key={hc.id}>
                          <td className="py-2 px-3 font-mono font-semibold">{hc.claim_no}</td>
                          <td className="py-2 px-3">Health Claim</td>
                          <td className="py-2 px-3">{hc.applicant_name} ({hc.relationship})</td>
                          <td className="py-2 px-3">{formatCurrency(hc.requested_amount)}</td>
                          <td className="py-2 px-3 font-semibold text-emerald-600">{formatCurrency(hc.sanctioned_amount)}</td>
                          <td className="py-2 px-3"><Badge variant="info" size="sm">{hc.claim_status}</Badge></td>
                        </tr>
                      ))}
                      {viewingAdvocate.claims?.death?.map((dc: any) => (
                        <tr key={dc.id}>
                          <td className="py-2 px-3 font-mono font-semibold text-rose-600">{dc.claim_no}</td>
                          <td className="py-2 px-3">Death Benefit</td>
                          <td className="py-2 px-3">{dc.applicant_name} ({dc.relationship})</td>
                          <td className="py-2 px-3">{formatCurrency(dc.requested_amount)}</td>
                          <td className="py-2 px-3 font-semibold text-emerald-600">{formatCurrency(dc.sanctioned_amount)}</td>
                          <td className="py-2 px-3"><Badge variant="danger" size="sm">{dc.claim_status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Advocate Removal / Archival"
        message={`Are you sure you want to remove ${advocateToDelete?.full_name} (${advocateToDelete?.advocate_code})? If financial transaction history exists, the advocate will be safely archived to preserve auditing records.`}
        confirmLabel="Confirm Action"
        loading={deleteLoading}
      />
    </div>
  );
}
