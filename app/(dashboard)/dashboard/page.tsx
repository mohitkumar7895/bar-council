"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";
import { SecretaryDashboard } from "@/components/dashboard/SecretaryDashboard";
import { AccountsDashboard } from "@/components/dashboard/AccountsDashboard";
import { DataEntryDashboard } from "@/components/dashboard/DataEntryDashboard";
import { CommitteeDashboard } from "@/components/dashboard/CommitteeDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"today" | "month" | "year" | "all">("year");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?period=${period}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const roleSlug = user?.roleSlug || "super_admin";

  switch (roleSlug) {
    case "admin_secretary":
      return (
        <SecretaryDashboard
          data={data}
          period={period}
          setPeriod={setPeriod}
          fetchStats={fetchStats}
          loading={loading}
        />
      );

    case "accounts_finance":
      return (
        <AccountsDashboard
          data={data}
          period={period}
          setPeriod={setPeriod}
          fetchStats={fetchStats}
          loading={loading}
        />
      );

    case "data_entry":
      return (
        <DataEntryDashboard
          data={data}
          period={period}
          setPeriod={setPeriod}
          fetchStats={fetchStats}
          loading={loading}
        />
      );

    case "readonly_committee":
      return (
        <CommitteeDashboard
          data={data}
          period={period}
          setPeriod={setPeriod}
          fetchStats={fetchStats}
          loading={loading}
        />
      );

    case "super_admin":
    default:
      return (
        <SuperAdminDashboard
          data={data}
          period={period}
          setPeriod={setPeriod}
          fetchStats={fetchStats}
          loading={loading}
        />
      );
  }
}
