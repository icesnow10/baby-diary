import type { NextApiRequest, NextApiResponse } from "next";
import { readData, writeData } from "@/lib/storage";
import { BabyData, DataKey } from "@/lib/types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const data = await readData();
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { key, item } = req.body as { key: DataKey; item: any };
      if (!key || !item) return res.status(400).json({ error: "key and item required" });
      const data = await readData();
      const list = (data[key] as any[]) ?? [];
      list.push(item);
      (data as any)[key] = list;
      await writeData(data);
      return res.status(200).json({ ok: true, item });
    }

    if (req.method === "PUT") {
      const { key, id, patch, replace } = req.body as {
        key: DataKey;
        id?: string;
        patch?: any;
        replace?: any[];
      };
      if (!key) return res.status(400).json({ error: "key required" });
      const data = await readData();
      if (replace) {
        (data as any)[key] = replace;
      } else if (id) {
        const list = (data[key] as any[]) ?? [];
        const idx = list.findIndex((x) => x.id === id);
        if (idx === -1) return res.status(404).json({ error: "not found" });
        list[idx] = { ...list[idx], ...patch };
        (data as any)[key] = list;
      } else {
        return res.status(400).json({ error: "id or replace required" });
      }
      await writeData(data);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const { key, id } = req.body as { key: DataKey; id: string };
      if (!key || !id) return res.status(400).json({ error: "key and id required" });
      const data = await readData();
      const list = (data[key] as any[]) ?? [];
      (data as any)[key] = list.filter((x) => x.id !== id);
      await writeData(data);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return res.status(405).end();
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal error" });
  }
}
