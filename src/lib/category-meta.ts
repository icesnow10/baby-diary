import type { CSSProperties } from "react";

export type CategoryKey =
  | "sleep"
  | "feeding"
  | "diaper"
  | "pump"
  | "medicine"
  | "growth";

interface CategoryMeta {
  label: string;
  color: string;
  bg: string;
  line: string;
  href: string;
}

export const CATEGORY_META: Record<CategoryKey, CategoryMeta> = {
  sleep: {
    label: "Sono",
    color: "#9d6ee8",
    bg: "#efe7ff",
    line: "rgba(157,110,232,0.28)",
    href: "/sleep",
  },
  feeding: {
    label: "Mamada",
    color: "#ef4f89",
    bg: "#ffe2ec",
    line: "rgba(239,79,137,0.28)",
    href: "/feeding",
  },
  diaper: {
    label: "Fralda",
    color: "#38bc94",
    bg: "#eefdf8",
    line: "#c9f3e5",
    href: "/diaper",
  },
  pump: {
    label: "Ordenha",
    color: "#e0524d",
    bg: "#ffecec",
    line: "#ffc8c8",
    href: "/pump",
  },
  medicine: {
    label: "Medicação",
    color: "#f5a13d",
    bg: "#ffeed8",
    line: "rgba(245,161,61,0.28)",
    href: "/medicine",
  },
  growth: {
    label: "Crescimento",
    color: "#7e5dd2",
    bg: "#ece2ff",
    line: "rgba(126,93,210,0.28)",
    href: "/growth",
  },
};

export function metricStyle(key: CategoryKey): CSSProperties {
  const m = CATEGORY_META[key];
  return {
    ["--metric-color" as any]: m.color,
    ["--metric-bg" as any]: m.bg,
    ["--metric-line" as any]: m.line,
  };
}
