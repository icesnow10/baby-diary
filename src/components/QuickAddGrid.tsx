import type { CSSProperties, ReactNode } from "react";
import { Bath, Gamepad2, Moon, Pill, Trees } from "lucide-react";
import { BottleIcon, DiaperIcon, PumpBottleIcon } from "@/components/icons";

export type QuickAddType = "sleep" | "feeding" | "diaper" | "pump" | "medicine" | "bath" | "playtime" | "outing";

const TONES: Record<string, CSSProperties> = {
  sleep: { ["--metric-bg" as any]: "#f8ecff", ["--metric-line" as any]: "#ecd6ff", ["--metric-color" as any]: "#9d6ee8" },
  feed: { ["--metric-bg" as any]: "#fff0f5", ["--metric-line" as any]: "#ffd5e4", ["--metric-color" as any]: "#ff5f93" },
  diaper: { ["--metric-bg" as any]: "#e9f8ed", ["--metric-line" as any]: "#bfe7c8", ["--metric-color" as any]: "#2f9e52" },
  pump: { ["--metric-bg" as any]: "#ffecec", ["--metric-line" as any]: "#ffc8c8", ["--metric-color" as any]: "#e0524d" },
  med: { ["--metric-bg" as any]: "#fff5e8", ["--metric-line" as any]: "#ffe0b5", ["--metric-color" as any]: "#ef9634" },
  bath: { ["--metric-bg" as any]: "#e6f6ff", ["--metric-line" as any]: "#c5e6fb", ["--metric-color" as any]: "#3aa4d8" },
  play: { ["--metric-bg" as any]: "#f0f8ff", ["--metric-line" as any]: "#c9e3ff", ["--metric-color" as any]: "#4f8fd8" },
  outing: { ["--metric-bg" as any]: "#fff8e1", ["--metric-line" as any]: "#ffe9a8", ["--metric-color" as any]: "#e0a91a" },
};

interface QuickAddItem {
  type: QuickAddType;
  label: string;
  tone: string;
  icon: ReactNode;
}

const QUICK_ADD_ITEMS: QuickAddItem[] = [
  { type: "sleep", label: "Sleep", icon: <Moon size={25} />, tone: "sleep" },
  { type: "feeding", label: "Feeding", icon: <BottleIcon size={25} />, tone: "feed" },
  { type: "diaper", label: "Diaper", icon: <DiaperIcon size={25} />, tone: "diaper" },
  { type: "pump", label: "Pumping", icon: <PumpBottleIcon size={25} />, tone: "pump" },
  { type: "medicine", label: "Medicine", icon: <Pill size={25} />, tone: "med" },
  { type: "bath", label: "Bath", icon: <Bath size={25} />, tone: "bath" },
  { type: "playtime", label: "Playtime", icon: <Gamepad2 size={25} />, tone: "play" },
  { type: "outing", label: "Outing", icon: <Trees size={25} />, tone: "outing" },
];

export default function QuickAddGrid({ onSelect }: { onSelect: (type: QuickAddType) => void }) {
  return (
    <div className="quickAddGrid">
      {QUICK_ADD_ITEMS.map((item) => (
        <button
          className="quickAddTile"
          type="button"
          key={item.type}
          style={TONES[item.tone]}
          onClick={() => onSelect(item.type)}
        >
          <span className="quickAddIcon">{item.icon}</span>
          <strong>{item.label}</strong>
        </button>
      ))}
    </div>
  );
}
