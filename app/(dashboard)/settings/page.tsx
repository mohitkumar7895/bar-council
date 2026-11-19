"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Save,
  CreditCard,
  FileCheck2,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useNotification } from "@/context/NotificationContext";

export default function SettingsPage() {
  const { user } = useAuth();
  const { refreshSettings } = useApp();
  const { notify } = useNotification();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [periods, setPeriods] = useState<any[]>([]);
  const [activePeriodId, setActivePeriodId] = useState("");

  const [formData, setFormData] = useState({
    association_name: "District Bar Association",
    association_registration_no: "BAR-REG/1984/DELHI-09",
    address: "District & Sessions Court Complex, Bar Association Building, Room 101-105",
    phone: "+91 11 2345 6789",
    email: "contact@districtbar.org.in",
    currency_symbol: "₹",
    admission_fee_default: "5000.00",
    monthly_chanda_default: "100.00",
    annual_dues_default: "1200.00",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setFormData((prev) => ({
            ...prev,
            ...d.settings,
          }));
          if (d.activePeriod) {
            setActivePeriodId(String(d.activePeriod.id));
          }
        }
      })
      .finally(() => setLoading(false));

    fetch("/api/membership/periods")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPeriods(d.data);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: formData,
          current_period_id: activePeriodId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.error || "Failed to save settings");
        return;
      }

      notify.success("System settings updated successfully!");
      refreshSettings();
    } catch (err: any) {
      notify.error(err.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-gold-500" />
            Bar Association Master Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure official association credentials, charter info, default fee schedules, and active accounting cycles.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Association Identity Card */}
        <Card>
          <CardHeader
            title="Association Registration & Contact Details"
            subtitle="Appears on official receipts, membership roll cards, and legal notices"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Registered Bar Association Name *"
                required
                value={formData.association_name}
                onChange={(e) => setFormData({ ...formData, association_name: e.target.value })}
              />

              <Input
                label="Bar Council Charter / Registration No *"
                required
                value={formData.association_registration_no}
                onChange={(e) => setFormData({ ...formData, association_registration_no: e.target.value })}
              />

              <Input
                label="Official Contact Telephone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <Input
                label="Official Contact Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Premises & Court Address
              </label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial & Fee Parameters */}
        <Card>
          <CardHeader
            title="Standard Fee Schedules & Accounting Cycle"
            subtitle="Default rates applied during advocate enrollment and batch dues generation"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Active Financial Cycle *
                </label>
                <select
                  value={activePeriodId}
                  onChange={(e) => setActivePeriodId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-navy-700 px-3.5 py-2 text-xs bg-white dark:bg-navy-900 focus:outline-none"
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.period_name} {p.is_current ? "(Current Active)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Default Admission Fee (₹)"
                type="number"
                value={formData.admission_fee_default}
                onChange={(e) => setFormData({ ...formData, admission_fee_default: e.target.value })}
              />

              <Input
                label="Default Monthly Chanda (₹)"
                type="number"
                value={formData.monthly_chanda_default}
                onChange={(e) => setFormData({ ...formData, monthly_chanda_default: e.target.value })}
              />

              <Input
                label="Default Annual Dues (₹)"
                type="number"
                value={formData.annual_dues_default}
                onChange={(e) => setFormData({ ...formData, annual_dues_default: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        {user?.roleSlug === "super_admin" && (
          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              variant="gold"
              size="lg"
              loading={saving}
              icon={<Save className="w-4 h-4" />}
            >
              Save System Configuration
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
