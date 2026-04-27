import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { BabyData, EMPTY_DATA, DataKey } from "@/lib/types";

interface DataContextValue {
  data: BabyData;
  loading: boolean;
  refresh: () => Promise<void>;
  add: <K extends DataKey>(key: K, item: BabyData[K] extends Array<infer U> ? U : never) => Promise<void>;
  update: <K extends DataKey>(key: K, id: string, patch: any) => Promise<void>;
  remove: (key: DataKey, id: string) => Promise<void>;
  replace: <K extends DataKey>(key: K, list: BabyData[K]) => Promise<void>;
}

const DataContext = createContext<DataContextValue>({
  data: EMPTY_DATA,
  loading: true,
  refresh: async () => {},
  add: async () => {},
  update: async () => {},
  remove: async () => {},
  replace: async () => {},
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BabyData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data");
      const json = (await res.json()) as BabyData;
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (key: DataKey, item: any) => {
    await fetch("/api/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, item }),
    });
    await refresh();
  }, [refresh]);

  const update = useCallback(async (key: DataKey, id: string, patch: any) => {
    await fetch("/api/data", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, id, patch }),
    });
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (key: DataKey, id: string) => {
    await fetch("/api/data", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, id }),
    });
    await refresh();
  }, [refresh]);

  const replace = useCallback(async (key: DataKey, list: any[]) => {
    await fetch("/api/data", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, replace: list }),
    });
    await refresh();
  }, [refresh]);

  return (
    <DataContext.Provider value={{ data, loading, refresh, add, update, remove, replace }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
