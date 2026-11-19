"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AppContextType {
  settings: Record<string, string>;
  activePeriod: { id: number; name: string } | null;
  loading: boolean;
  currencySymbol: string;
  associationName: string;
  refreshSettings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({
    association_name: "District Bar Association",
    currency_symbol: "₹",
    current_period: "2026-2027",
  });
  const [activePeriod, setActivePeriod] = useState<{ id: number; name: string } | null>({
    id: 2,
    name: "2026-2027",
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
        if (data.activePeriod) {
          setActivePeriod(data.activePeriod);
        }
      }
    } catch {
      // Fallback defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <AppContext.Provider
      value={{
        settings,
        activePeriod,
        loading,
        currencySymbol: settings.currency_symbol || "₹",
        associationName: settings.association_name || "District Bar Association",
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
