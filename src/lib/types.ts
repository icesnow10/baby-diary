export type Side = "left" | "right";
export type DiaperType = "wet" | "dirty" | "mix" | "dry";
export type DiaperCream = "assadura" | "hipoglos" | "both";
export type FeedingKind = "nursing" | "bottle";
export type BottleSource = "breastmilk" | "formula";
export type MedicineUnit = "ml" | "drops" | "tsp";

export interface SleepEntry {
  id: string;
  start: string; // ISO
  end?: string | null;   // ISO
  notes?: string;
}

export interface FeedingEntry {
  id: string;
  time: string; // ISO — for nursing this is the start
  kind: FeedingKind;
  side?: Side;                      // when nursing
  end?: string | null;              // when nursing — ISO end time
  durationMin?: number | null;      // when nursing
  source?: BottleSource;            // when bottle
  volumeMl?: number;                // when bottle
  notes?: string;
}

export interface DiaperEntry {
  id: string;
  time: string; // ISO
  type: DiaperType;
  cream?: DiaperCream;
  notes?: string;
}

export interface DiaperInventoryItem {
  size: string; // RN, P, M, G, GG, XXG
  count: number;
}

export interface PumpEntry {
  id: string;
  side?: Side;
  start: string; // ISO
  finish?: string | null; // ISO
  volumeMl?: number;
  notes?: string;
}

export interface GrowthEntry {
  id: string;
  date: string; // YYYY-MM-DD
  heightCm?: number;
  weightKg?: number;
  headCm?: number;
}

export interface MedicineDose {
  name: string;
  amount?: number;
  unit?: MedicineUnit;
}

export interface MedicineEntry {
  id: string;
  time: string; // ISO
  doses: MedicineDose[];
  notes?: string;
}

export interface BathEntry {
  id: string;
  time: string; // ISO
  notes?: string;
}

export interface PlaytimeEntry {
  id: string;
  time: string; // ISO
  notes?: string;
}

export interface OutingEntry {
  id: string;
  time?: string; // legacy ISO
  start?: string; // ISO
  end?: string; // ISO
  place?: string;
  notes?: string;
}

export interface BabyProfile {
  name: string;
  birthDate?: string; // YYYY-MM-DD
  avatarUrl?: string;
}

export interface MedicineReminder {
  id: string;
  medicine: string;
  start: string; // ISO
  end: string;   // ISO
  active: boolean;
  snoozedUntil?: string | null; // ISO
}

export interface MedicineRegistryItem {
  id: string;
  name: string;
  notes?: string;
}

export interface BabyData {
  profile: BabyProfile;
  sleep: SleepEntry[];
  feeding: FeedingEntry[];
  diaper: DiaperEntry[];
  diaperInventory: DiaperInventoryItem[];
  pump: PumpEntry[];
  growth: GrowthEntry[];
  medicine: MedicineEntry[];
  medicineReminders: MedicineReminder[];
  medicineRegistry: MedicineRegistryItem[];
  bath: BathEntry[];
  playtime: PlaytimeEntry[];
  outing: OutingEntry[];
}

export const EMPTY_DATA: BabyData = {
  profile: { name: "Bebê" },
  sleep: [],
  feeding: [],
  diaper: [],
  diaperInventory: [
    { size: "RN", count: 0 },
    { size: "P", count: 0 },
    { size: "M", count: 0 },
    { size: "G", count: 0 },
    { size: "GG", count: 0 },
    { size: "XXG", count: 0 },
  ],
  pump: [],
  growth: [],
  medicine: [],
  medicineReminders: [],
  medicineRegistry: [],
  bath: [],
  playtime: [],
  outing: [],
};

export type DataKey =
  | "sleep"
  | "feeding"
  | "diaper"
  | "diaperInventory"
  | "pump"
  | "growth"
  | "medicine"
  | "medicineReminders"
  | "medicineRegistry"
  | "bath"
  | "playtime"
  | "outing";
