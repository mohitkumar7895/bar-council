"use client";

import React, { useState, useEffect } from "react";
import {
  UserCog,
  Plus,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";

export default function UsersPage() {
  const { user: currentAuthUser, hasPermission } = useAuth();
  const { notify } = useNotification();

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch {
      notify.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/users/roles");
      const json = await res.json();
      if (json.success) setRoles(json.data);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setRoleId(roles[0]?.id ? String(roles[0].id) : "1");
    setStatus("active");
    setModalOpen(true);
  };

  const handleOpenEditModal = (u: any) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone || "");
    setPassword(""); // Keep blank unless resetting
    setRoleId(String(u.role_id));
    setStatus(u.status);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role_id: Number(roleId),
          status,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Action failed");
        return;
      }

      notify.success(editingUser ? "User updated successfully" : "User created successfully");
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        notify.success("User removed successfully");
        setDeleteConfirmOpen(false);
        fetchUsers();
      } else {
        notify.error(json.error || "Failed to delete user");
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
            <UserCog className="w-6 h-6 text-gold-500" />
            Administrative User Management & RBAC
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Grant role-based credentials, manage bar office accounts, and maintain security audit trails.
          </p>
        </div>

        {currentAuthUser?.roleSlug === "super_admin" && (
          <Button
            variant="gold"
            onClick={handleOpenAddModal}
            icon={<Plus className="w-4 h-4" />}
          >
            Create System User
          </Button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950/60 border-b border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">User Details</th>
                <th className="py-3 px-4 font-semibold">Email & Phone</th>
                <th className="py-3 px-4 font-semibold">Assigned Role</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Last Login</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-navy-800 text-gold-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span>{u.name}</span>
                          {currentAuthUser?.id === u.id && (
                            <span className="ml-2 text-[10px] text-amber-500 font-bold">(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{u.email}</div>
                      {u.phone && <div className="text-[10px] text-slate-400">{u.phone}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          u.role_slug === "super_admin"
                            ? "gold"
                            : u.role_slug === "admin_secretary"
                            ? "info"
                            : u.role_slug === "accounts_finance"
                            ? "success"
                            : "neutral"
                        }
                      >
                        {u.role_name}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.status === "active" ? "success" : "danger"} size="sm">
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDateTime(u.last_login)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {currentAuthUser?.roleSlug === "super_admin" && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                              title="Edit User / Reset Password"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {currentAuthUser.id !== u.id && (
                              <button
                                onClick={() => {
                                  setUserToDelete(u);
                                  setDeleteConfirmOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                                title="Remove User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "Edit User Account & Role" : "Create New Administrative User"}
        subtitle="Manage user permissions and credentials."
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            required
            placeholder="e.g. Adv. Rajeshwar Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Official Email Address *"
            type="email"
            required
            placeholder="e.g. user@districtbar.org.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Phone Number"
            placeholder="e.g. +91 9811122334"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Role & Permissions Level *
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
              required
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.description}
                </option>
              ))}
            </select>
          </div>

          <Select
            label="Account Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive (Revoke Access)" },
              { value: "suspended", label: "Suspended" },
            ]}
          />

          <Input
            label={editingUser ? "Reset Password (Leave blank to keep existing)" : "Initial Password *"}
            type="password"
            placeholder="••••••••••••"
            required={!editingUser}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

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
              {editingUser ? "Update Account" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Confirm User Account Removal"
        message={`Are you sure you want to permanently delete user "${userToDelete?.name}" (${userToDelete?.email})?`}
        loading={deleting}
      />
    </div>
  );
}
