import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { App } from "antd";
import { BabyData, EMPTY_DATA, DataKey, BabyProfile } from "@/lib/types";

const ENTRY_LABELS: Partial<Record<DataKey, string>> = {
  sleep: "Sleep",
  feeding: "Feeding",
  diaper: "Diaper",
  pump: "Pumping",
  growth: "Growth",
  medicine: "Medicine",
  bath: "Bath",
  playtime: "Playtime",
  outing: "Outing",
};

interface MutationOptions {
  silent?: boolean;
}

interface DataContextValue {
  data: BabyData;
  loading: boolean;
  refresh: () => Promise<void>;
  add: <K extends DataKey>(key: K, item: BabyData[K] extends Array<infer U> ? U : never, options?: MutationOptions) => Promise<void>;
  update: <K extends DataKey>(key: K, id: string, patch: any, options?: MutationOptions) => Promise<void>;
  updateProfile: (patch: Partial<BabyProfile>) => Promise<void>;
  remove: (key: DataKey, id: string, options?: MutationOptions) => Promise<void>;
  replace: <K extends DataKey>(key: K, list: BabyData[K]) => Promise<void>;
}

const DataContext = createContext<DataContextValue>({
  data: EMPTY_DATA,
  loading: true,
  refresh: async () => {},
  add: async () => {},
  update: async () => {},
  updateProfile: async () => {},
  remove: async () => {},
  replace: async () => {},
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BabyData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const lastRefreshAt = useRef(0);
  const { modal } = App.useApp();
  const modalRef = useRef(modal);

  useEffect(() => {
    modalRef.current = modal;
  }, [modal]);

  const notify = useCallback(
    (variant: "success" | "error", title: string, content?: string) => {
      modalRef.current[variant]({
        title,
        content,
        okText: "OK",
        centered: true,
      });
    },
    [],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      const json = (await res.json()) as BabyData;
      setData(json);
      lastRefreshAt.current = Date.now();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const staleMs = 5 * 60 * 1000;
    const refreshIfStale = () => {
      if (Date.now() - lastRefreshAt.current >= staleMs) refresh();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshIfStale();
    };
    const onFocus = () => refreshIfStale();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) refreshIfStale();
    };
    const interval = window.setInterval(refresh, staleMs);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [refresh]);

  const add = useCallback(async (key: DataKey, item: any, options: MutationOptions = {}) => {
    const res = await fetch("/api/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, item }),
    });
    await refresh();
    if (!options.silent) {
      if (res.ok) {
        notify("success", `${ENTRY_LABELS[key] ?? "Entry"} saved`, "Your record was added.");
      } else {
        notify("error", "Could not save", "Please try again.");
      }
    }
  }, [refresh, notify]);

  const update = useCallback(async (key: DataKey, id: string, patch: any, options: MutationOptions = {}) => {
    const res = await fetch("/api/data", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, id, patch }),
    });
    await refresh();
    if (!options.silent) {
      if (res.ok) {
        notify("success", `${ENTRY_LABELS[key] ?? "Entry"} updated`, "Your record was updated.");
      } else {
        notify("error", "Could not update", "Please try again.");
      }
    }
  }, [refresh, notify]);

  const updateProfile = useCallback(async (patch: Partial<BabyProfile>) => {
    await fetch("/api/data", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: "profile", patch }),
    });
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (key: DataKey, id: string, options: MutationOptions = {}) => {
    const res = await fetch("/api/data", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, id }),
    });
    await refresh();
    if (!options.silent) {
      if (res.ok) {
        notify("success", `${ENTRY_LABELS[key] ?? "Entry"} deleted`, "The record was removed.");
      } else {
        notify("error", "Could not delete", "Please try again.");
      }
    }
  }, [refresh, notify]);

  const replace = useCallback(async (key: DataKey, list: any[]) => {
    await fetch("/api/data", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, replace: list }),
    });
    await refresh();
  }, [refresh]);

  return (
    <DataContext.Provider value={{ data, loading, refresh, add, update, updateProfile, remove, replace }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
