import path from "path";
import fs from "fs/promises";
import { BabyData, EMPTY_DATA } from "./types";

const DATA_FILE = path.join(process.cwd(), "resources", "data.json");

async function ensureFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(EMPTY_DATA, null, 2), "utf-8");
  }
}

export async function readData(): Promise<BabyData> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw) as Partial<BabyData>;
  return {
    profile: parsed.profile ?? EMPTY_DATA.profile,
    sleep: parsed.sleep ?? [],
    feeding: parsed.feeding ?? [],
    diaper: parsed.diaper ?? [],
    diaperInventory: parsed.diaperInventory ?? EMPTY_DATA.diaperInventory,
    pump: parsed.pump ?? [],
    growth: parsed.growth ?? [],
    medicine: parsed.medicine ?? [],
    bath: parsed.bath ?? [],
    outing: parsed.outing ?? [],
  };
}

export async function writeData(data: BabyData): Promise<void> {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}
