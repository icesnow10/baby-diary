import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Typography } from "antd";
import dayjs from "dayjs";
import AppShell from "@/components/AppShell";
import DailySummary from "@/components/DailySummary";
import Timeline, {
  TimelineRow,
  TimelineSortControl,
  TimelineSortOrder,
  buildTimelineRows,
  sortTimelineRows,
} from "@/components/Timeline";
import { useData } from "@/context/DataContext";

function dateKey(iso: string) {
  return dayjs(iso).format("YYYY-MM-DD");
}

function dayLabel(key: string) {
  const d = dayjs(key);
  const today = dayjs().startOf("day");
  if (d.isSame(today, "day")) return "Today";
  if (d.isSame(today.subtract(1, "day"), "day")) return "Yesterday";
  return d.format("ddd, MMM D");
}

export default function HistoryPage() {
  const router = useRouter();
  const { data } = useData();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [timelineSortOrder, setTimelineSortOrder] = useState<TimelineSortOrder>("desc");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const dateChipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const programmaticScroll = useRef(false);

  const timeline = useMemo<TimelineRow[]>(
    () => sortTimelineRows(buildTimelineRows(data), timelineSortOrder),
    [data, timelineSortOrder],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, TimelineRow[]>();
    for (const row of timeline) {
      const key = dateKey(row.time);
      const list = map.get(key);
      if (list) list.push(row);
      else map.set(key, [row]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      const delta = dayjs(a).valueOf() - dayjs(b).valueOf();
      return timelineSortOrder === "asc" ? delta : -delta;
    });
  }, [timeline, timelineSortOrder]);

  const dateKeys = useMemo(() => grouped.map(([key]) => key), [grouped]);
  const months = useMemo(() => {
    const seen = new Set<string>();
    return grouped.reduce<{ key: string; label: string; firstDateKey: string }[]>((acc, [key]) => {
      const monthKey = dayjs(key).format("YYYY-MM");
      if (seen.has(monthKey)) return acc;
      seen.add(monthKey);
      acc.push({
        key: monthKey,
        label: dayjs(key).format("MMM YYYY"),
        firstDateKey: key,
      });
      return acc;
    }, []);
  }, [grouped]);
  const activeMonthKey = activeKey ? dayjs(activeKey).format("YYYY-MM") : null;

  useEffect(() => {
    if (!activeKey && dateKeys.length) setActiveKey(dateKeys[0]);
  }, [dateKeys, activeKey]);

  useEffect(() => {
    if (!dateKeys.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScroll.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const key = (visible[0].target as HTMLElement).dataset.dateKey;
          if (key) setActiveKey(key);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [dateKeys]);

  useEffect(() => {
    if (!activeKey) return;
    const chip = dateChipRefs.current.get(activeKey);
    if (chip) chip.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeKey]);

  const handleDateClick = (key: string) => {
    const section = sectionRefs.current.get(key);
    if (!section) return;
    setActiveKey(key);
    programmaticScroll.current = true;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      programmaticScroll.current = false;
    }, 700);
  };

  const handleMonthClick = (key: string) => {
    const chip = dateChipRefs.current.get(key);
    if (chip) chip.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveKey(key);
  };

  const handleEdit = (entry: TimelineRow) => {
    router.push({ pathname: "/", query: { edit: `${entry.recordType}:${entry.recordId}` } });
  };

  const handleAddBetween = (iso: string) => {
    router.push({ pathname: "/", query: { quickAdd: iso } });
  };

  return (
    <AppShell title="History" subtitle="Timeline grouped by day">
      <div className="historyPage">
        <div className="historyJumpPanel">
          {months.length > 0 ? (
            <div className="historyMonthStrip" aria-label="Jump date strip to month">
              {months.map((month) => (
                <button
                  key={month.key}
                  type="button"
                  className={month.key === activeMonthKey ? "historyMonthChip active" : "historyMonthChip"}
                  aria-pressed={month.key === activeMonthKey}
                  onClick={() => handleMonthClick(month.firstDateKey)}
                >
                  {month.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="historyDateStrip" role="tablist" aria-label="Jump to date">
            {grouped.length === 0 ? (
              <span className="historyDateEmpty">No entries yet</span>
            ) : (
              grouped.map(([key, rows]) => {
                const d = dayjs(key);
                const isActive = key === activeKey;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={isActive ? "historyDateChip active" : "historyDateChip"}
                    ref={(el) => {
                      if (el) dateChipRefs.current.set(key, el);
                      else dateChipRefs.current.delete(key);
                    }}
                    onClick={() => handleDateClick(key)}
                  >
                    <span className="historyDateChipDow">{d.format("ddd")}</span>
                    <strong className="historyDateChipDay">{d.format("D")}</strong>
                    <span className="historyDateChipMonth">{d.format("MMM")}</span>
                    <em className="historyDateChipCount">{rows.length}</em>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {grouped.length > 0 ? (
          <div className="historySortBar">
            <span>Timeline order</span>
            <TimelineSortControl order={timelineSortOrder} onChange={setTimelineSortOrder} />
          </div>
        ) : null}

        <div className="historyTimeline">
          {grouped.length === 0 ? (
            <Typography.Text type="secondary" className="historyEmpty">
              Add records on the Home page and they will show up here grouped by day.
            </Typography.Text>
          ) : (
            grouped.map(([key, rows]) => {
              return (
                <section
                  key={key}
                  data-date-key={key}
                  ref={(el) => {
                    if (el) sectionRefs.current.set(key, el);
                    else sectionRefs.current.delete(key);
                  }}
                  className="historyDateSection"
                >
                  <header className="historyDateHeader">
                    <strong>{dayLabel(key)}</strong>
                    <span>{dayjs(key).format("MMMM D, YYYY")}</span>
                  </header>
                  <DailySummary
                    data={data}
                    start={dayjs(key).startOf("day")}
                    end={dayjs(key).add(1, "day").startOf("day")}
                    title="Day Summary"
                    label={dayjs(key).format("MMM D")}
                    className="historyDaySummary"
                  />
                  <Timeline
                    entries={rows}
                    onEdit={handleEdit}
                    onAddBetween={handleAddBetween}
                    sortOrder={timelineSortOrder}
                  />
                </section>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
