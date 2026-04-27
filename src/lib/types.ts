export type Side = "left" | "right";
export type DiaperType = "wet" | "dirty" | "mix" | "dry";
export type DiaperCream = "assadura" | "hipoglos";
export type FeedingKind = "nursing" | "bottle";
export type BottleSource = "breastmilk" | "formula";
export type MedicineUnit = "ml" | "drops" | "tsp";

export interface SleepEntry {
  id: string;
  start: string; // ISO
  end: string;   // ISO
  notes?: string;
}

export interface FeedingEntry {
  id: string;
  time: string; // ISO
  kind: FeedingKind;
  side?: Side;            // when nursing
  durationMin?: number;   // when nursing
  source?: BottleSource;  // when bottle
  volumeMl?: number;      // when bottle
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
  side: Side;
  start: string; // ISO
  finish: string; // ISO
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
  amount: number;
  unit: MedicineUnit;
}

export interface MedicineEntry {
  id: string;
  time: string; // ISO
  doses: MedicineDose[];
  notes?: string;
}

export interface BabyData {
  sleep: SleepEntry[];
  feeding: FeedingEntry[];
  diaper: DiaperEntry[];
  diaperInventory: DiaperInventoryItem[];
  pump: PumpEntry[];
  growth: GrowthEntry[];
  medicine: MedicineEntry[];
}

export const EMPTY_DATA: BabyData = {
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
};

export type DataKey =
  | "sleep"
  | "feeding"
  | "diaper"
  | "diaperInventory"
  | "pump"
  | "growth"
  | "medicine";
