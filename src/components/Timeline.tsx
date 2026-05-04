import { useMemo, useState } from "react";
import type React from "react";
import dayjs from "dayjs";
import { Bath, ChevronRight, Gamepad2, Moon, Pill, Plus, Trees } from "lucide-react";
import { BottleIcon, DiaperIcon, PumpBottleIcon } from "@/components/icons";
import { BabyData } from "@/lib/types";
import { formatDuration } from "@/lib/format";

export type TimelineRecordType =
  | "sleep"
  | "feeding"
  | "diaper"
  | "pump"
  | "medicine"
  | "growth"
  | "bath"
  | "playtime"
  | "outing";

export type TimelineRow = {
  id: string;
  time: string;
  windowAnchor: string;
  title: string;
  detail: string;
  tone: string;
  icon: React.ReactNode;
  recordType: TimelineRecordType;
  recordId: string;
};

type TimelineDisplayRow = TimelineRow & {
  stackedRows?: TimelineRow[];
};

export type TimelineSortOrder = "asc" | "desc";

export const timelineMetricStyles: Record<string, React.CSSProperties> = {
  sleep: { "--metric-bg": "#f8ecff", "--metric-line": "#ecd6ff", "--metric-color": "#9d6ee8" } as React.CSSProperties,
  feed: { "--metric-bg": "#fff0f5", "--metric-line": "#ffd5e4", "--metric-color": "#ff5f93" } as React.CSSProperties,
  diaper: { "--metric-bg": "#eefdf8", "--metric-line": "#c9f3e5", "--metric-color": "#38bc94" } as React.CSSProperties,
  pump: { "--metric-bg": "#ffecec", "--metric-line": "#ffc8c8", "--metric-color": "#e0524d" } as React.CSSProperties,
  med: { "--metric-bg": "#fff5e8", "--metric-line": "#ffe0b5", "--metric-color": "#ef9634" } as React.CSSProperties,
  bath: { "--metric-bg": "#e6f6ff", "--metric-line": "#c5e6fb", "--metric-color": "#3aa4d8" } as React.CSSProperties,
  play: { "--metric-bg": "#f0f8ff", "--metric-line": "#c9e3ff", "--metric-color": "#4f8fd8" } as React.CSSProperties,
  outing: { "--metric-bg": "#fff8e1", "--metric-line": "#ffe9a8", "--metric-color": "#e0a91a" } as React.CSSProperties,
};

export function buildTimelineRows(data: BabyData): TimelineRow[] {
  const rows: TimelineRow[] = [
    ...(data.sleep ?? []).map((entry) => {
      const startDay = dayjs(entry.start).startOf("day");
      const endDayDelta = entry.end ? dayjs(entry.end).startOf("day").diff(startDay, "day") : 0;
      const overnightSuffix = endDayDelta > 0 ? ` (+${endDayDelta}d)` : "";
      const detail = entry.end
        ? `${dayjs(entry.start).format("HH:mm")} - ${dayjs(entry.end).format("HH:mm")}${overnightSuffix} (${formatDuration(entry.start, entry.end)})`
        : `${dayjs(entry.start).format("HH:mm")} - now (${formatDuration(entry.start, dayjs().toISOString())})`;
      return {
        id: `sleep-${entry.id}`,
        time: entry.start,
        windowAnchor: entry.end ?? dayjs().toISOString(),
        title: "Sleep",
        detail,
        tone: "sleep",
        icon: <Moon size={18} />,
        recordType: "sleep" as TimelineRecordType,
        recordId: entry.id,
      };
    }),
    ...(data.feeding ?? []).map((entry) => {
      let detail: string;
      if (entry.kind === "nursing") {
        if (entry.end) {
          const dayDelta = dayjs(entry.end).startOf("day").diff(dayjs(entry.time).startOf("day"), "day");
          const overnight = dayDelta > 0 ? ` (+${dayDelta}d)` : "";
          detail = `Breast - ${formatDuration(entry.time, entry.end)}${overnight}`;
        } else if (entry.durationMin) {
          detail = `Breast - ${entry.durationMin} min`;
        } else {
          detail = "Breast - in progress";
        }
      } else {
        detail = `${entry.source} - ${entry.volumeMl ?? 0} ml`;
      }
      return {
        id: `feeding-${entry.id}`,
        time: entry.time,
        windowAnchor: entry.kind === "nursing" ? entry.end ?? dayjs().toISOString() : entry.time,
        title: entry.kind === "nursing" ? "Nursing" : "Feeding (Bottle)",
        detail,
        tone: "feed",
        icon: <BottleIcon size={18} />,
        recordType: "feeding" as TimelineRecordType,
        recordId: entry.id,
      };
    }),
    ...(data.diaper ?? []).map((entry) => ({
      id: `diaper-${entry.id}`,
      time: entry.time,
      windowAnchor: entry.time,
      title: "Diaper",
      detail: `${entry.type}${entry.cream ? ` - Diaper cream (${entry.cream})` : ""}`,
      tone: "diaper",
      icon: <DiaperIcon size={18} />,
      recordType: "diaper" as TimelineRecordType,
      recordId: entry.id,
    })),
    ...(data.pump ?? []).map((entry) => ({
      id: `pump-${entry.id}`,
      time: entry.start,
      windowAnchor: entry.finish,
      title: "Pumping",
      detail: `${entry.side} ${formatDuration(entry.start, entry.finish)}${entry.volumeMl ? ` / ${entry.volumeMl} ml` : ""}`,
      tone: "pump",
      icon: <PumpBottleIcon size={18} />,
      recordType: "pump" as TimelineRecordType,
      recordId: entry.id,
    })),
    ...(data.medicine ?? []).map((entry) => ({
      id: `medicine-${entry.id}`,
      time: entry.time,
      windowAnchor: entry.time,
      title: "Medicine",
      detail: entry.doses
        .map((dose) => `${dose.name}${dose.amount ? ` - ${dose.amount} ${dose.unit ?? ""}` : ""}`)
        .join(", "),
      tone: "med",
      icon: <Pill size={18} />,
      recordType: "medicine" as TimelineRecordType,
      recordId: entry.id,
    })),
    ...(data.bath ?? []).map((entry) => ({
      id: `bath-${entry.id}`,
      time: entry.time,
      windowAnchor: entry.time,
      title: "Bath",
      detail: "Bath time",
      tone: "bath",
      icon: <Bath size={18} />,
      recordType: "bath" as TimelineRecordType,
      recordId: entry.id,
    })),
    ...(data.playtime ?? []).map((entry) => ({
      id: `playtime-${entry.id}`,
      time: entry.time,
      windowAnchor: entry.time,
      title: "Playtime",
      detail: "Playtime",
      tone: "play",
      icon: <Gamepad2 size={18} />,
      recordType: "playtime" as TimelineRecordType,
      recordId: entry.id,
    })),
    ...(data.outing ?? []).map((entry) => ({
      id: `outing-${entry.id}`,
      time: entry.start ?? entry.time ?? dayjs().toISOString(),
      windowAnchor: entry.end ?? entry.start ?? entry.time ?? dayjs().toISOString(),
      title: "Outing",
      detail:
        `${entry.start ? `${dayjs(entry.start).format("HH:mm")} - ${entry.end ? dayjs(entry.end).format("HH:mm") : "now"}` : ""}${entry.place ? ` / ${entry.place}` : ""}` ||
        "Outing",
      tone: "outing",
      icon: <Trees size={18} />,
      recordType: "outing" as TimelineRecordType,
      recordId: entry.id,
    })),
  ];
  return rows;
}

export function sortTimelineRows(entries: TimelineRow[], order: TimelineSortOrder) {
  return [...entries].sort((a, b) => {
    const delta = dayjs(a.time).valueOf() - dayjs(b.time).valueOf();
    return order === "asc" ? delta : -delta;
  });
}

function isBathDiaperPair(a: TimelineRow, b: TimelineRow) {
  const pair = new Set([a.recordType, b.recordType]);
  return pair.has("bath") && pair.has("diaper") && dayjs(a.time).isSame(dayjs(b.time), "minute");
}

function buildDisplayRows(entries: TimelineRow[]): TimelineDisplayRow[] {
  const consumed = new Set<string>();
  const rows: TimelineDisplayRow[] = [];

  for (const entry of entries) {
    if (consumed.has(entry.id)) continue;
    if (entry.recordType !== "bath" && entry.recordType !== "diaper") {
      rows.push(entry);
      continue;
    }

    const pair = entries.find((candidate) => !consumed.has(candidate.id) && isBathDiaperPair(entry, candidate));
    if (!pair) {
      rows.push(entry);
      continue;
    }

    const diaper = entry.recordType === "diaper" ? entry : pair;
    const bath = entry.recordType === "bath" ? entry : pair;
    consumed.add(entry.id);
    consumed.add(pair.id);
    const diaperAnchor = dayjs(diaper.windowAnchor);
    const bathAnchor = dayjs(bath.windowAnchor);
    rows.push({
      ...bath,
      id: `${diaper.id}-${bath.id}`,
      windowAnchor: bathAnchor.isAfter(diaperAnchor) ? bath.windowAnchor : diaper.windowAnchor,
      title: "Diaper + Bath",
      detail: `${diaper.detail} / ${bath.detail}`,
      stackedRows: [diaper, bath],
    });
  }

  return rows;
}

export function TimelineSortControl({
  order,
  onChange,
}: {
  order: TimelineSortOrder;
  onChange: (order: TimelineSortOrder) => void;
}) {
  return (
    <div className="timelineSortControl" role="group" aria-label="Timeline order">
      <button
        type="button"
        className={order === "asc" ? "active" : ""}
        onClick={() => onChange("asc")}
        aria-pressed={order === "asc"}
      >
        Asc
      </button>
      <button
        type="button"
        className={order === "desc" ? "active" : ""}
        onClick={() => onChange("desc")}
        aria-pressed={order === "desc"}
      >
        Desc
      </button>
    </div>
  );
}

export default function Timeline({
  entries,
  onEdit,
  onAddBetween,
  showTrailingGap = true,
  showSortControl = false,
  initialSortOrder = "desc",
  sortOrder,
  onSortOrderChange,
}: {
  entries: TimelineRow[];
  onEdit: (entry: TimelineRow) => void;
  onAddBetween: (defaultTimeISO: string) => void;
  showTrailingGap?: boolean;
  showSortControl?: boolean;
  initialSortOrder?: TimelineSortOrder;
  sortOrder?: TimelineSortOrder;
  onSortOrderChange?: (order: TimelineSortOrder) => void;
}) {
  const [internalSortOrder, setInternalSortOrder] = useState<TimelineSortOrder>(initialSortOrder);
  const activeSortOrder = sortOrder ?? internalSortOrder;
  const sortedEntries = useMemo(() => sortTimelineRows(entries, activeSortOrder), [entries, activeSortOrder]);
  const displayEntries = useMemo(() => buildDisplayRows(sortedEntries), [sortedEntries]);
  const updateSortOrder = (nextOrder: TimelineSortOrder) => {
    if (!sortOrder) setInternalSortOrder(nextOrder);
    onSortOrderChange?.(nextOrder);
  };

  return (
    <>
      {showSortControl ? <TimelineSortControl order={activeSortOrder} onChange={updateSortOrder} /> : null}
      <div className="todayTimelineList">
      {displayEntries.map((entry, index) => {
        const previous = displayEntries[index - 1];
        const previousAnchor = previous ? dayjs(previous.windowAnchor) : null;
        const currentTime = dayjs(entry.time);
        const stackedIcons = entry.stackedRows;
        const defaultTime =
          previousAnchor && previousAnchor.isBefore(currentTime) ? previousAnchor : currentTime;
        return (
          <div key={`tl-${entry.id}`} className="todayTimelineGroup">
            <button
              className="todayTimelineGap"
              type="button"
              onClick={() => onAddBetween(defaultTime.toISOString())}
              aria-label="Add entry between"
            >
              <span className="todayTimelineGapIcon">
                <Plus size={14} />
              </span>
            </button>
            <button
              className="todayTimelineRow"
              style={timelineMetricStyles[entry.tone]}
              type="button"
              onClick={() => onEdit(entry)}
            >
              <div className="todayTimelineTime">{dayjs(entry.time).format("HH:mm")}</div>
              <div className="todayTimelineRail">
                <span />
              </div>
              {stackedIcons ? (
                <div className="todayTimelineIconStack" aria-hidden="true">
                  {stackedIcons.map((stackedEntry) => (
                    <span
                      key={`${entry.id}-${stackedEntry.id}`}
                      className="todayTimelineIcon stacked"
                      style={timelineMetricStyles[stackedEntry.tone]}
                    >
                      {stackedEntry.icon}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="todayTimelineIcon">{entry.icon}</div>
              )}
              <div className="todayTimelineCard">
                <strong>{entry.title}</strong>
                <span>{entry.detail}</span>
              </div>
              <ChevronRight className="todayTimelineChevron" size={15} />
            </button>
          </div>
        );
      })}
      {showTrailingGap && displayEntries.length > 0 ? (
        <button
          className="todayTimelineGap"
          type="button"
          onClick={() => {
            const last = displayEntries[displayEntries.length - 1];
            onAddBetween(dayjs(last.windowAnchor).toISOString());
          }}
          aria-label="Add entry after last"
        >
          <span className="todayTimelineGapIcon">
            <Plus size={14} />
          </span>
        </button>
      ) : null}
      </div>
    </>
  );
}
