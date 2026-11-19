"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FolderLock,
  Search,
  Upload,
  Download,
  Trash2,
  FileText,
  FileCheck2,
  Shield,
  Eye,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";

export default function DocumentsPage() {
  const { hasPermission } = useAuth();
  const { notify } = useNotification();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Upload Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("registration_cert");
  const [entityType, setEntityType] = useState("advocate");
  const [entityId, setEntityId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Advocates
  const [advocates, setAdvocates] = useState<any[]>([]);

  // Delete
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/advocates?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAdvocates(d.data);
      });
  }, []);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search,
        category: categoryFilter,
      });
      const res = await fetch(`/api/documents?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalRecords(json.pagination.total);
      }
    } catch {
      notify.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, categoryFilter]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      notify.error("Please choose a file to upload");
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("title", title);
    fd.append("category", category);
    fd.append("entity_type", entityType);
    if (entityId) fd.append("entity_id", entityId);
    fd.append("remarks", remarks);
    fd.append("file", file);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Upload failed");
        return;
      }

      notify.success("Document uploaded securely");
      setUploadModalOpen(false);
      fetchDocs();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${docToDelete.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        notify.success("Document removed");
        setDeleteConfirmOpen(false);
        fetchDocs();
      } else {
        notify.error(json.error || "Deletion failed");
      }
    } catch {
      notify.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FolderLock className="w-6 h-6 text-gold-500" />
            Secure Documents & Certifications Repository
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Encrypted storage for advocate state bar certificates, photo ID cards, committee minutes, and proofs.
          </p>
        </div>

        {hasPermission("documents:manage") && (
          <Button
            variant="gold"
            onClick={() => {
              setTitle("");
              setRemarks("");
              setFile(null);
              setEntityId(advocates[0]?.id ? String(advocates[0].id) : "");
              setUploadModalOpen(true);
            }}
            icon={<Upload className="w-4 h-4" />}
          >
            Upload Document
          </Button>
        )}
      </div>

      <Card>
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, filename or advocate..."
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
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="registration_cert">Bar Registration Certificate</option>
              <option value="id_proof">Identity Proof (Aadhaar / Voter / PAN)</option>
              <option value="court_id">High Court / District Court ID</option>
              <option value="minutes">Committee Meeting Minutes</option>
              <option value="notice">Official Gazette / Notice</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950/60 border-y border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Document Title</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Linked Entity</th>
                <th className="py-3 px-4 font-semibold">Filename</th>
                <th className="py-3 px-4 font-semibold">Uploaded By</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Verification</th>
                <th className="py-3 px-4 font-semibold text-center">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No documents uploaded in this category.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{doc.title}</span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-300">
                      {doc.category.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                      {doc.entity_label || doc.entity_type}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                      {doc.original_filename}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{doc.uploader_name || "Staff"}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(doc.created_at)}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success" size="sm">
                        {doc.verification_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 dark:hover:text-gold-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                          title="Secure Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {hasPermission("documents:manage") && (
                          <button
                            onClick={() => {
                              setDocToDelete(doc);
                              setDeleteConfirmOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                            title="Delete Document"
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

      {/* Upload Document Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Association Document"
        subtitle="File will be stored securely with access restricted to authenticated officers."
        size="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <Input
            label="Document Title *"
            required
            placeholder="e.g. State Bar Enrolment Certificate - Adv. Arun Aggarwal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Select
            label="Document Category *"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: "registration_cert", label: "Bar Council Registration Certificate" },
              { value: "id_proof", label: "Identity Proof (Aadhaar / Voter / PAN)" },
              { value: "court_id", label: "High Court / District Court ID Card" },
              { value: "minutes", label: "General Body / Committee Meeting Minutes" },
              { value: "notice", label: "Official Notification / Gazette" },
              { value: "other", label: "Other Supporting Document" },
            ]}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Attach to Advocate Member (Optional)
            </label>
            <select
              value={entityId}
              onChange={(e) => {
                setEntityId(e.target.value);
                setEntityType(e.target.value ? "advocate" : "general");
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
            >
              <option value="">-- General Association Document --</option>
              {advocates.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.full_name} ({adv.advocate_code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select File to Upload *
            </label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy-100 file:text-navy-900 dark:file:bg-navy-800 dark:file:text-gold-400 hover:file:bg-navy-200 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reviewer Notes / Summary
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              placeholder="Verification notes or document details..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              loading={uploading}
            >
              Upload & Verify
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Document Deletion"
        message={`Are you sure you want to permanently delete "${docToDelete?.title}"? The file will be removed from secure server storage.`}
        loading={deleting}
      />
    </div>
  );
}
