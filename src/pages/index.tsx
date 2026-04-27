import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Button, Col, DatePicker, Form, Input, InputNumber, Modal, Radio, Row, Select, Space, Spin, Typography } from "antd";
import dayjs from "dayjs";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Baby, BarChart3, Bath, BriefcaseMedical, CalendarDays, ChevronRight, Milk, Moon, Pill, Ruler, Trees } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useData } from "@/context/DataContext";
import { durationMinutes, formatDuration, newId, todayRange } from "@/lib/format";

type RecordType = "sleep" | "feeding" | "diaper" | "pump" | "medicine" | "growth" | "bath" | "outing";

type TimelineRow = {
  id: string;
  time: string;
  windowAnchor: string;
  title: string;
  detail: string;
  tone: string;
  icon: React.ReactNode;
  recordType: RecordType;
  recordId: string;
};

const metricStyles = {
  sleep: { "--metric-bg": "#f8ecff", "--metric-line": "#ecd6ff", "--metric-color": "#9d6ee8" },
  feed: { "--metric-bg": "#fff0f5", "--metric-line": "#ffd5e4", "--metric-color": "#ff5f93" },
  diaper: { "--metric-bg": "#fff8e1", "--metric-line": "#ffe9a8", "--metric-color": "#e0a91a" },
  pump: { "--metric-bg": "#ffecec", "--metric-line": "#ffc8c8", "--metric-color": "#e0524d" },
  med: { "--metric-bg": "#fff5e8", "--metric-line": "#ffe0b5", "--metric-color": "#ef9634" },
  bath: { "--metric-bg": "#e6f6ff", "--metric-line": "#c5e6fb", "--metric-color": "#3aa4d8" },
  outing: { "--metric-bg": "#e9f8ed", "--metric-line": "#bfe7c8", "--metric-color": "#2f9e52" },
} as Record<string, React.CSSProperties>;

function timeOnToday(value: dayjs.Dayjs) {
  return dayjs()
    .hour(value.hour())
    .minute(value.minute())
    .second(0)
    .millisecond(0);
}

function timeRangeOnToday(startValue: dayjs.Dayjs, endValue: dayjs.Dayjs) {
  const rangeStart = timeOnToday(startValue);
  let rangeEnd = timeOnToday(endValue);
  if (rangeEnd.isBefore(rangeStart) || rangeEnd.isSame(rangeStart)) rangeEnd = rangeEnd.add(1, "day");
  return [rangeStart, rangeEnd] as const;
}

function NativeTimeInput({
  value,
  onChange,
}: {
  value?: dayjs.Dayjs;
  onChange?: (value?: dayjs.Dayjs) => void;
}) {
  const [draft, setDraft] = useState(value ? value.format("HH:mm") : "");

  useEffect(() => {
    setDraft(value ? value.format("HH:mm") : "");
  }, [value]);

  const commit = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (!digits) {
      setDraft("");
      onChange?.(undefined);
      return;
    }
    const padded = digits.padStart(4, "0");
    const hour = Math.min(Number(padded.slice(0, 2)), 23);
    const minute = Math.min(Number(padded.slice(2, 4)), 59);
    const formatted = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    setDraft(formatted);
    onChange?.(dayjs().hour(hour).minute(minute).second(0).millisecond(0));
  };

  return (
    <input
      className="nativeTimeInput"
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder="HH:mm"
      value={draft}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
        const next = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
        setDraft(next);
        if (digits.length === 4) commit(digits);
        if (!digits) {
          onChange?.(undefined);
        }
      }}
      onBlur={() => commit(draft)}
    />
  );
}

export default function HomePage() {
  const { data, loading, refresh, add, update, remove } = useData();
  const [activeModal, setActiveModal] = useState<RecordType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [start, end] = todayRange();

  const editingEntry = useMemo(() => {
    if (!activeModal || !editingId) return null;
    const list = (data as any)[activeModal] as any[] | undefined;
    return list?.find((entry) => entry.id === editingId) ?? null;
  }, [activeModal, editingId, data]);

  const openModal = (type: RecordType, id: string | null = null) => {
    setActiveModal(type);
    setEditingId(id);
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingId(null);
  };

  const summary = useMemo(() => {
    const inToday = (iso: string) => {
      const t = dayjs(iso);
      return t.isAfter(start) && t.isBefore(end);
    };
    const sleepToday = data.sleep
      .filter((entry) => inToday(entry.end ?? dayjs().toISOString()))
      .reduce((total, entry) => total + durationMinutes(entry.start, entry.end ?? dayjs().toISOString()), 0);
    const feeds = data.feeding.filter((entry) => {
      if (entry.kind === "nursing") return inToday(entry.end ?? entry.time);
      return inToday(entry.time);
    }).length;
    const diapers = data.diaper.filter((entry) => inToday(entry.time)).length;
    const pumping = data.pump.filter((entry) => inToday(entry.finish)).length;
    const medicines = data.medicine.filter((entry) => inToday(entry.time)).length;
    const baths = data.bath.filter((entry) => inToday(entry.time)).length;
    const outings = data.outing.filter((entry) => inToday(entry.end ?? entry.start ?? entry.time ?? dayjs().toISOString())).length;
    const latestGrowth = [...data.growth].sort((a, b) => b.date.localeCompare(a.date))[0];

    return { sleepToday, feeds, diapers, pumping, medicines, baths, outings, latestGrowth };
  }, [data, start, end]);

  const timeline = useMemo<TimelineRow[]>(() => {
    const rows: TimelineRow[] = [
      ...data.sleep.map((entry) => {
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
          recordType: "sleep" as RecordType,
          recordId: entry.id,
        };
      }),
      ...data.feeding.map((entry) => {
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
          icon: <Milk size={18} />,
          recordType: "feeding" as RecordType,
          recordId: entry.id,
        };
      }),
      ...data.diaper.map((entry) => ({
        id: `diaper-${entry.id}`,
        time: entry.time,
        windowAnchor: entry.time,
        title: "Diaper",
        detail: `${entry.type}${entry.cream ? ` - Diaper cream (${entry.cream})` : ""}`,
        tone: "diaper",
        icon: <Baby size={18} />,
        recordType: "diaper" as RecordType,
        recordId: entry.id,
      })),
      ...data.pump.map((entry) => ({
        id: `pump-${entry.id}`,
        time: entry.start,
        windowAnchor: entry.finish,
        title: "Pumping",
        detail: `${entry.side} ${formatDuration(entry.start, entry.finish)}${entry.volumeMl ? ` / ${entry.volumeMl} ml` : ""}`,
        tone: "pump",
        icon: <BriefcaseMedical size={18} />,
        recordType: "pump" as RecordType,
        recordId: entry.id,
      })),
      ...data.medicine.map((entry) => ({
        id: `medicine-${entry.id}`,
        time: entry.time,
        windowAnchor: entry.time,
        title: "Medicine",
        detail: entry.doses.map((dose) => `${dose.name} - ${dose.amount} ${dose.unit}`).join(", "),
        tone: "med",
        icon: <Pill size={18} />,
        recordType: "medicine" as RecordType,
        recordId: entry.id,
      })),
      ...data.bath.map((entry) => ({
        id: `bath-${entry.id}`,
        time: entry.time,
        windowAnchor: entry.time,
        title: "Bath",
        detail: entry.notes ?? "Bath time",
        tone: "bath",
        icon: <Bath size={18} />,
        recordType: "bath" as RecordType,
        recordId: entry.id,
      })),
      ...data.outing.map((entry) => ({
        id: `outing-${entry.id}`,
        time: entry.start ?? entry.time ?? dayjs().toISOString(),
        windowAnchor: entry.end ?? entry.start ?? entry.time ?? dayjs().toISOString(),
        title: "Outing",
        detail: `${entry.start ? `${dayjs(entry.start).format("HH:mm")} - ${entry.end ? dayjs(entry.end).format("HH:mm") : "now"}` : ""}${entry.place ? ` / ${entry.place}` : ""}` || "Outing",
        tone: "outing",
        icon: <Trees size={18} />,
        recordType: "outing" as RecordType,
        recordId: entry.id,
      })),
    ];
    return rows
      .filter((row) => {
        const anchor = dayjs(row.windowAnchor);
        return anchor.isAfter(start) && anchor.isBefore(end);
      })
      .sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf())
      .slice(0, 8);
  }, [data, start, end]);

  const growthChart = useMemo(
    () =>
      [...data.growth]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => ({ date: dayjs(entry.date).format("MMM D"), weight: entry.weightKg ?? 0 })),
    [data.growth],
  );

  const quickAdd = [
    { type: "sleep" as const, label: "Sleep", icon: <Moon size={25} />, tone: "sleep" },
    { type: "feeding" as const, label: "Feeding", icon: <Milk size={25} />, tone: "feed" },
    { type: "diaper" as const, label: "Diaper", icon: <Baby size={25} />, tone: "diaper" },
    { type: "pump" as const, label: "Pumping", icon: <BriefcaseMedical size={25} />, tone: "pump" },
    { type: "bath" as const, label: "Bath", icon: <Bath size={25} />, tone: "bath" },
    { type: "outing" as const, label: "Outing", icon: <Trees size={25} />, tone: "outing" },
  ];

  return (
    <AppShell title="Emma" subtitle="3 months, 12 days" onAddClick={() => openModal("feeding")}>
      <Space direction="vertical" size={18} style={{ width: "100%" }}>
        <section className="dashboardHero">
          <div>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Today
            </Typography.Title>
            <Typography.Text type="secondary">Care records stored privately in your JSON file.</Typography.Text>
          </div>
          <Button icon={<CalendarDays size={16} />} onClick={refresh} loading={loading}>
            {dayjs().format("MMM D, YYYY")}
          </Button>
        </section>

        <section className="panel summaryPanel">
          <Typography.Title className="mobileSectionTitle" level={5}>Today's Summary</Typography.Title>
          <div className="summaryGrid">
            <div className="babyMetric" style={metricStyles.sleep}>
              <div className="babyMetricIcon"><Moon size={24} /></div>
              <strong>{formatDuration(summary.sleepToday)}</strong>
              <span>Sleep</span>
            </div>
            <div className="babyMetric" style={metricStyles.feed}>
              <div className="babyMetricIcon"><Milk size={24} /></div>
              <strong>{summary.feeds}</strong>
              <span>Feedings</span>
            </div>
            <div className="babyMetric" style={metricStyles.diaper}>
              <div className="babyMetricIcon"><Baby size={24} /></div>
              <strong>{summary.diapers}</strong>
              <span>Diapers</span>
            </div>
            <div className="babyMetric" style={metricStyles.pump}>
              <div className="babyMetricIcon"><BriefcaseMedical size={24} /></div>
              <strong>{summary.pumping}</strong>
              <span>Pumping</span>
            </div>
            <div className="babyMetric" style={metricStyles.bath}>
              <div className="babyMetricIcon"><Bath size={24} /></div>
              <strong>{summary.baths}</strong>
              <span>Bath</span>
            </div>
          </div>
        </section>

        <section className="panel mobileQuickPanel">
          <Typography.Title level={5} style={{ margin: 0 }}>Quick Add</Typography.Title>
          <Typography.Text type="secondary">Tap to add</Typography.Text>
          <div className="quickAddGrid">
            {quickAdd.map((item) => (
              <button className="quickAddTile" type="button" key={item.type} style={metricStyles[item.tone]} onClick={() => openModal(item.type)}>
                <span className="quickAddIcon">{item.icon}</span>
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="panel todayTimelinePanel">
          <Typography.Title level={5} style={{ margin: 0 }}>Today's Timeline</Typography.Title>
          <div className="todayTimelineList">
            {timeline.map((entry) => (
              <button
                className="todayTimelineRow"
                key={`today-${entry.id}`}
                style={metricStyles[entry.tone]}
                type="button"
                onClick={() => openModal(entry.recordType, entry.recordId)}
              >
                <div className="todayTimelineTime">{dayjs(entry.time).format("HH:mm")}</div>
                <div className="todayTimelineRail"><span /></div>
                <div className="todayTimelineIcon">{entry.icon}</div>
                <div className="todayTimelineCard">
                  <strong>{entry.title}</strong>
                  <span>{entry.detail}</span>
                </div>
                <ChevronRight className="todayTimelineChevron" size={15} />
              </button>
            ))}
          </div>
        </section>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <section className="panel desktopOnlyPanel">
              <Typography.Title level={4}>Growth</Typography.Title>
              <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col span={8}><strong>{summary.latestGrowth?.weightKg ?? 0} kg</strong><br /><Typography.Text type="secondary">Weight</Typography.Text></Col>
                <Col span={8}><strong>{summary.latestGrowth?.heightCm ?? 0} cm</strong><br /><Typography.Text type="secondary">Height</Typography.Text></Col>
                <Col span={8}><strong>{summary.latestGrowth?.headCm ?? 0} cm</strong><br /><Typography.Text type="secondary">Head</Typography.Text></Col>
              </Row>
              <div className="chartBox short">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthChart}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="weight" stroke="#ff6fa3" fill="#ff6fa3" fillOpacity={0.18} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="panel desktopOnlyPanel">
              <Typography.Title level={4}>Diaper Inventory</Typography.Title>
              <Space direction="vertical" style={{ width: "100%" }}>
                {data.diaperInventory.map((item) => (
                  <Row key={item.size} justify="space-between">
                    <Typography.Text>{item.size}</Typography.Text>
                    <strong>{item.count} pcs</strong>
                  </Row>
                ))}
              </Space>
            </section>
          </Col>
        </Row>

      </Space>
      <AddRecordModal
        type={activeModal}
        editingEntry={editingEntry}
        latestBathTime={[...data.bath].sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf())[0]?.time}
        latestFeedingTime={[...data.feeding]
          .map((entry) => (entry.kind === "nursing" ? entry.end ?? entry.time : entry.time))
          .sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf())[0]}
        openSleep={data.sleep.find((entry) => !entry.end)}
        openFeeding={data.feeding.find((entry) => entry.kind === "nursing" && !entry.end && !entry.durationMin)}
        onSleepPersist={refresh}
        onFeedingPersist={refresh}
        onClose={closeModal}
        onDelete={async () => {
          if (!activeModal || !editingId) return;
          await remove(activeModal as any, editingId);
          closeModal();
        }}
        onSleepCancel={async (id) => {
          await remove("sleep", id);
        }}
        onFeedingCancel={async (id) => {
          await remove("feeding", id);
        }}
        onSubmit={async (type, values) => {
          const editId: string | undefined = editingId ?? undefined;
          if (type === "sleep") {
            const liveSleep = data.sleep.find((entry) => entry.id === values.sleepId);
            const baseSource = editingEntry?.start ?? liveSleep?.start;
            const baseDay = baseSource
              ? dayjs(baseSource).startOf("day")
              : dayjs().startOf("day");
            let sleepStart = baseDay
              .hour(values.startTime.hour())
              .minute(values.startTime.minute())
              .second(0)
              .millisecond(0);
            let sleepEnd = baseDay
              .hour(values.endTime.hour())
              .minute(values.endTime.minute())
              .second(0)
              .millisecond(0);
            if (sleepEnd.isBefore(sleepStart) || sleepEnd.isSame(sleepStart)) sleepEnd = sleepEnd.add(1, "day");
            if (!baseSource) {
              const now = dayjs();
              if (sleepStart.isAfter(now) && sleepEnd.isAfter(now)) {
                sleepStart = sleepStart.subtract(1, "day");
                sleepEnd = sleepEnd.subtract(1, "day");
              }
            }
            const targetId = editId ?? values.sleepId;
            const conflict = data.sleep.find((s) => {
              if (s.id === targetId) return false;
              if (!s.end) return false;
              const sStart = dayjs(s.start);
              const sEnd = dayjs(s.end);
              return sleepStart.isBefore(sEnd) && sStart.isBefore(sleepEnd);
            });
            if (conflict) {
              Modal.error({
                title: "Sleep conflict",
                content: `This sleep overlaps another sleep at ${dayjs(conflict.start).format("HH:mm")} - ${dayjs(conflict.end!).format("HH:mm")}. Please check the timeline before saving.`,
                okText: "OK",
              });
              return;
            }
            if (targetId) {
              await update("sleep", targetId, { start: sleepStart.toISOString(), end: sleepEnd.toISOString() });
            } else {
              await add("sleep", { id: newId(), start: sleepStart.toISOString(), end: sleepEnd.toISOString() });
            }
          }
          if (type === "feeding") {
            if (values.mode === "breast") {
              const liveFeeding = data.feeding.find((entry) => entry.id === values.feedingId);
              const baseSource = editingEntry?.time ?? liveFeeding?.time;
              const baseDay = baseSource
                ? dayjs(baseSource).startOf("day")
                : dayjs().startOf("day");
              let feedStart = baseDay
                .hour(values.startTime.hour())
                .minute(values.startTime.minute())
                .second(0)
                .millisecond(0);
              let feedEnd = baseDay
                .hour(values.endTime.hour())
                .minute(values.endTime.minute())
                .second(0)
                .millisecond(0);
              if (feedEnd.isBefore(feedStart) || feedEnd.isSame(feedStart)) feedEnd = feedEnd.add(1, "day");
              if (!baseSource) {
                const now = dayjs();
                if (feedStart.isAfter(now) && feedEnd.isAfter(now)) {
                  feedStart = feedStart.subtract(1, "day");
                  feedEnd = feedEnd.subtract(1, "day");
                }
              }
              const durationMin = feedEnd.diff(feedStart, "minute");
              const targetId = editId ?? values.feedingId;
              const conflict = data.feeding.find((f) => {
                if (f.id === targetId) return false;
                if (f.kind !== "nursing") return false;
                if (!f.end) return false;
                const fStart = dayjs(f.time);
                const fEnd = dayjs(f.end);
                return feedStart.isBefore(fEnd) && fStart.isBefore(feedEnd);
              });
              if (conflict) {
                Modal.error({
                  title: "Nursing conflict",
                  content: `This nursing overlaps another nursing at ${dayjs(conflict.time).format("HH:mm")} - ${dayjs(conflict.end!).format("HH:mm")}. Please check the timeline before saving.`,
                  okText: "OK",
                });
                return;
              }
              const payload = {
                time: feedStart.toISOString(),
                kind: "nursing" as const,
                end: feedEnd.toISOString(),
                durationMin,
              };
              if (targetId) {
                await update("feeding", targetId, payload);
              } else {
                await add("feeding", { id: newId(), ...payload });
            }
          } else {
              const payload = {
                time: timeOnToday(values.time).toISOString(),
                kind: "bottle" as const,
                source: values.source,
                volumeMl: values.volumeMl,
                notes: values.notes,
              };
              if (editId) {
                await update("feeding", editId, payload);
              } else {
                await add("feeding", { id: newId(), ...payload });
              }
            }
          }
          if (type === "diaper") {
            const payload = { time: timeOnToday(values.time).toISOString(), type: values.diaperType, cream: values.cream, notes: values.notes };
            if (editId) {
              await update("diaper", editId, payload);
            } else {
              await add("diaper", { id: newId(), ...payload });
            }
          }
          if (type === "pump") {
            const [pumpStart, pumpFinish] = timeRangeOnToday(values.startTime, values.endTime);
            const payload = {
              side: values.side,
              start: pumpStart.toISOString(),
              finish: pumpFinish.toISOString(),
              volumeMl: values.volumeMl,
              notes: values.notes,
            };
            if (editId) {
              await update("pump", editId, payload);
            } else {
              await add("pump", { id: newId(), ...payload });
            }
          }
          if (type === "medicine") {
            const payload = {
              time: values.time.toISOString(),
              doses: [{ name: values.name, amount: values.amount, unit: values.unit }],
              notes: values.notes,
            };
            if (editId) {
              await update("medicine", editId, payload);
            } else {
              await add("medicine", { id: newId(), ...payload });
            }
          }
          if (type === "growth") {
            const payload = {
              date: values.date.format("YYYY-MM-DD"),
              heightCm: values.heightCm,
              weightKg: values.weightKg,
              headCm: values.headCm,
            };
            if (editId) {
              await update("growth", editId, payload);
            } else {
              await add("growth", { id: newId(), ...payload });
            }
          }
          if (type === "bath") {
            const payload = { time: timeOnToday(values.time).toISOString(), notes: values.notes };
            if (editId) {
              await update("bath", editId, payload);
            } else {
              await add("bath", { id: newId(), ...payload });
            }
          }
          if (type === "outing") {
            const [outingStart, outingEnd] = timeRangeOnToday(values.startTime, values.endTime);
            const payload = { start: outingStart.toISOString(), end: outingEnd.toISOString(), place: values.place };
            if (editId) {
              await update("outing", editId, payload);
            } else {
              await add("outing", { id: newId(), ...payload });
            }
          }
          closeModal();
        }}
      />
    </AppShell>
  );
}

function FeedingModePills({ value, onChange }: { value?: string; onChange?: (next: string) => void }) {
  const options: { label: string; value: string }[] = [
    { label: "Breast", value: "breast" },
    { label: "Bottle", value: "bottle" },
  ];
  return (
    <div className="feedingModePills">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={value === opt.value ? "feedingModePill active" : "feedingModePill"}
          onClick={() => onChange?.(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function AddRecordModal({
  type,
  editingEntry,
  latestBathTime,
  latestFeedingTime,
  openSleep,
  openFeeding,
  onSleepPersist,
  onFeedingPersist,
  onClose,
  onDelete,
  onSubmit,
  onSleepCancel,
  onFeedingCancel,
}: {
  type: RecordType | null;
  editingEntry?: any | null;
  latestBathTime?: string;
  latestFeedingTime?: string;
  openSleep?: { id: string; start: string };
  openFeeding?: { id: string; time: string };
  onSleepPersist: () => Promise<void>;
  onFeedingPersist: () => Promise<void>;
  onClose: () => void;
  onDelete: () => Promise<void>;
  onSubmit: (type: RecordType, values: any) => Promise<void>;
  onSleepCancel: (id: string) => Promise<void>;
  onFeedingCancel: (id: string) => Promise<void>;
}) {
  const isEditing = Boolean(editingEntry);
  const [form] = Form.useForm();
  const [clockNow, setClockNow] = useState(dayjs());
  const [sleepRunning, setSleepRunning] = useState(false);
  const [feedingRunning, setFeedingRunning] = useState(false);
  const sleepStartTime = Form.useWatch("startTime", form);
  const sleepEndTime = Form.useWatch("endTime", form);
  const sleepId = Form.useWatch("sleepId", form);
  const feedingMode = Form.useWatch("mode", form) ?? "breast";
  const feedingStartTime = type === "feeding" ? sleepStartTime : undefined;
  const feedingEndTime = type === "feeding" ? sleepEndTime : undefined;
  const feedingId = Form.useWatch("feedingId", form);

  const meta = {
    sleep: { title: "Sleep", icon: <Moon size={22} />, tone: "sleep" },
    feeding: { title: "Feeding", icon: <Milk size={22} />, tone: "feed" },
    diaper: { title: "Diaper", icon: <Baby size={22} />, tone: "diaper" },
    pump: { title: "Pumping", icon: <BriefcaseMedical size={22} />, tone: "pump" },
    medicine: { title: "Medicine", icon: <Pill size={22} />, tone: "med" },
    growth: { title: "Growth", icon: <BarChart3 size={22} />, tone: "sleep" },
    bath: { title: "Bath", icon: <Bath size={22} />, tone: "bath" },
    outing: { title: "Outing", icon: <Trees size={22} />, tone: "outing" },
  };

  const initialValues = useMemo(
    () => ({
      time: dayjs(),
      start: undefined,
      startTime: undefined,
      end: dayjs().add(30, "minute"),
      endTime: undefined,
      finish: dayjs().add(15, "minute"),
      date: dayjs(),
      mode: "breast",
      side: "left",
      source: "breastmilk",
      diaperType: "wet",
      cream: undefined,
      unit: "ml",
      name: undefined,
    }),
    [],
  );

  const persistSleepStart = async (startValue: dayjs.Dayjs) => {
    const sleepStart = dayjs()
      .hour(startValue.hour())
      .minute(startValue.minute())
      .second(0)
      .millisecond(0);

    if (sleepId) {
      await fetch("/api/data", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: "sleep", id: sleepId, patch: { start: sleepStart.toISOString() } }),
      });
      await onSleepPersist();
      return;
    }

    const id = newId();
    await fetch("/api/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: "sleep", item: { id, start: sleepStart.toISOString() } }),
    });
    form.setFieldValue("sleepId", id);
    await onSleepPersist();
  };

  const persistFeedingStart = async (startValue: dayjs.Dayjs) => {
    const feedStart = dayjs()
      .hour(startValue.hour())
      .minute(startValue.minute())
      .second(0)
      .millisecond(0);

    if (feedingId) {
      await fetch("/api/data", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: "feeding", id: feedingId, patch: { time: feedStart.toISOString(), side: undefined } }),
      });
      await onFeedingPersist();
      return;
    }

    const id = newId();
    await fetch("/api/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: "feeding", item: { id, time: feedStart.toISOString(), kind: "nursing" } }),
    });
    form.setFieldValue("feedingId", id);
    await onFeedingPersist();
  };

  useEffect(() => {
    if (!sleepRunning && !feedingRunning) return;
    const timer = window.setInterval(() => setClockNow(dayjs()), 1000);
    return () => window.clearInterval(timer);
  }, [sleepRunning, feedingRunning]);

  useEffect(() => {
    if (type === "sleep" && sleepEndTime) setSleepRunning(false);
    if (type === "feeding" && feedingEndTime) setFeedingRunning(false);
  }, [sleepEndTime, feedingEndTime, type]);

  const current = type ? meta[type] : meta.sleep;
  const sleepInProgress = type === "sleep" && Boolean(sleepStartTime) && !sleepEndTime;
  const sleepBaseDay =
    type === "sleep"
      ? editingEntry?.start
        ? dayjs(editingEntry.start).startOf("day")
        : openSleep?.start
          ? dayjs(openSleep.start).startOf("day")
          : dayjs().startOf("day")
      : dayjs().startOf("day");
  const sleepStartAbsolute = sleepStartTime
    ? sleepBaseDay.hour(sleepStartTime.hour()).minute(sleepStartTime.minute()).second(0).millisecond(0)
    : null;
  const sleepEndAbsolute = (() => {
    if (!sleepStartAbsolute) return null;
    if (sleepEndTime) {
      let candidate = sleepBaseDay
        .hour(sleepEndTime.hour())
        .minute(sleepEndTime.minute())
        .second(0)
        .millisecond(0);
      if (candidate.isBefore(sleepStartAbsolute) || candidate.isSame(sleepStartAbsolute)) {
        candidate = candidate.add(1, "day");
      }
      return candidate;
    }
    return clockNow.isAfter(sleepStartAbsolute) ? clockNow : sleepStartAbsolute;
  })();
  const sleepOvernight =
    sleepStartAbsolute && sleepEndAbsolute
      ? sleepEndAbsolute.startOf("day").diff(sleepStartAbsolute.startOf("day"), "day")
      : 0;
  const sleepDuration =
    type === "sleep" && sleepStartAbsolute && sleepEndAbsolute
      ? formatDuration(sleepStartAbsolute.toISOString(), sleepEndAbsolute.toISOString())
      : "0m";

  const feedingNursing = feedingMode === "breast";
  const feedingInProgress = type === "feeding" && feedingNursing && Boolean(feedingStartTime) && !feedingEndTime;
  const feedingBaseDay =
    type === "feeding"
      ? editingEntry?.time
        ? dayjs(editingEntry.time).startOf("day")
        : openFeeding?.time
          ? dayjs(openFeeding.time).startOf("day")
          : dayjs().startOf("day")
      : dayjs().startOf("day");
  const feedingStartAbsolute = feedingStartTime
    ? feedingBaseDay.hour(feedingStartTime.hour()).minute(feedingStartTime.minute()).second(0).millisecond(0)
    : null;
  const feedingEndAbsolute = (() => {
    if (!feedingStartAbsolute) return null;
    if (feedingEndTime) {
      let candidate = feedingBaseDay
        .hour(feedingEndTime.hour())
        .minute(feedingEndTime.minute())
        .second(0)
        .millisecond(0);
      if (candidate.isBefore(feedingStartAbsolute) || candidate.isSame(feedingStartAbsolute)) {
        candidate = candidate.add(1, "day");
      }
      return candidate;
    }
    return clockNow.isAfter(feedingStartAbsolute) ? clockNow : feedingStartAbsolute;
  })();
  const feedingDuration =
    type === "feeding" && feedingNursing && feedingStartAbsolute && feedingEndAbsolute
      ? formatDuration(feedingStartAbsolute.toISOString(), feedingEndAbsolute.toISOString())
      : "0m";

  return (
    <Modal
      open={Boolean(type)}
      centered
      footer={null}
      onCancel={onClose}
      className={type === "sleep" ? "addRecordModal sleepModal" : "addRecordModal"}
      title={
        <div className="modalTitle" style={metricStyles[current.tone]}>
          <span>{current.icon}</span>
          <strong>{current.title}</strong>
        </div>
      }
      afterOpenChange={(open) => {
        if (open) {
          let startTime: dayjs.Dayjs | undefined = initialValues.startTime;
          let endTime: dayjs.Dayjs | undefined;
          let mode: string = initialValues.mode;
          let feedingIdValue: string | undefined;
          let sleepIdValue: string | undefined;
          const overrides: Record<string, any> = {};
          let isLiveSleep = false;
          let isLiveFeeding = false;

          if (editingEntry && type) {
            if (type === "sleep") {
              startTime = dayjs(editingEntry.start);
              endTime = editingEntry.end ? dayjs(editingEntry.end) : undefined;
              sleepIdValue = editingEntry.id;
              isLiveSleep = !editingEntry.end;
            } else if (type === "feeding") {
              if (editingEntry.kind === "nursing") {
                startTime = dayjs(editingEntry.time);
                endTime = editingEntry.end ? dayjs(editingEntry.end) : undefined;
                mode = "breast";
                feedingIdValue = editingEntry.id;
                isLiveFeeding = !editingEntry.end && !editingEntry.durationMin;
              } else {
                mode = "bottle";
                overrides.time = dayjs(editingEntry.time);
                overrides.source = editingEntry.source;
                overrides.volumeMl = editingEntry.volumeMl;
                overrides.notes = editingEntry.notes;
              }
            } else if (type === "diaper") {
              overrides.time = dayjs(editingEntry.time);
              overrides.diaperType = editingEntry.type;
              overrides.cream = editingEntry.cream;
              overrides.notes = editingEntry.notes;
            } else if (type === "pump") {
              startTime = dayjs(editingEntry.start);
              endTime = dayjs(editingEntry.finish);
              overrides.side = editingEntry.side;
              overrides.volumeMl = editingEntry.volumeMl;
              overrides.notes = editingEntry.notes;
            } else if (type === "medicine") {
              overrides.time = dayjs(editingEntry.time);
              const dose = editingEntry.doses?.[0];
              if (dose) {
                overrides.name = dose.name;
                overrides.amount = dose.amount;
                overrides.unit = dose.unit;
              }
              overrides.notes = editingEntry.notes;
            } else if (type === "growth") {
              overrides.date = dayjs(editingEntry.date);
              overrides.heightCm = editingEntry.heightCm;
              overrides.weightKg = editingEntry.weightKg;
              overrides.headCm = editingEntry.headCm;
            } else if (type === "bath") {
              overrides.time = dayjs(editingEntry.time);
              overrides.notes = editingEntry.notes;
            } else if (type === "outing") {
              startTime = editingEntry.start || editingEntry.time ? dayjs(editingEntry.start ?? editingEntry.time) : undefined;
              endTime = editingEntry.end ? dayjs(editingEntry.end) : undefined;
              overrides.place = editingEntry.place;
            }
          } else {
            if (type === "sleep" && openSleep) {
              startTime = dayjs(openSleep.start);
              sleepIdValue = openSleep.id;
              isLiveSleep = true;
            } else if (type === "feeding" && openFeeding) {
              startTime = dayjs(openFeeding.time);
              mode = "breast";
              feedingIdValue = openFeeding.id;
              isLiveFeeding = true;
            }
          }

          form.setFieldsValue({
            ...initialValues,
            ...overrides,
            mode,
            sleepId: type === "sleep" ? sleepIdValue : undefined,
            feedingId: type === "feeding" ? feedingIdValue : undefined,
            startTime,
            endTime,
          });
          setClockNow(dayjs());
          setSleepRunning(isLiveSleep);
          setFeedingRunning(isLiveFeeding);
        }
      }}
    >
      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={(values) => (type ? onSubmit(type, values) : undefined)}>
        {type === "sleep" ? (
          <>
            <Form.Item name="sleepId" hidden>
              <Input />
            </Form.Item>
            <div className="sleepActionRow">
              {sleepInProgress ? (
                <Button
                  danger
                  onClick={async () => {
                    const id = form.getFieldValue("sleepId");
                    if (id) await onSleepCancel(id);
                    form.setFieldsValue({ sleepId: undefined, startTime: undefined, endTime: undefined });
                    setSleepRunning(false);
                  }}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => {
                    const now = dayjs();
                    form.setFieldsValue({ startTime: now, endTime: undefined });
                    setClockNow(now);
                    setSleepRunning(true);
                    persistSleepStart(now);
                  }}
                >
                  Start now
                </Button>
              )}
              <Button
                onClick={() => {
                  const now = dayjs();
                  form.setFieldsValue({ endTime: now });
                  setClockNow(now);
                  setSleepRunning(false);
                }}
                disabled={!sleepStartTime}
              >
                Finish
              </Button>
            </div>
            <Form.Item name="startTime" label="Start" rules={[{ required: true }]}>
              <NativeTimeInput
                onChange={(value) => {
                  if (!value) return;
                  setSleepRunning(!form.getFieldValue("endTime"));
                  persistSleepStart(value);
                }}
              />
            </Form.Item>
            <Form.Item name="endTime" label="End" rules={[{ required: true }]}>
              <NativeTimeInput />
            </Form.Item>
            <div className={sleepInProgress ? "sleepTimer active" : "sleepTimer"}>
              <span>
                {sleepInProgress ? "Sleeping" : "Total sleep"}
                {sleepOvernight > 0 ? ` · +${sleepOvernight}d` : ""}
              </span>
              <strong>
                {sleepInProgress ? <Spin size="small" /> : null}
                {sleepDuration}
              </strong>
            </div>
          </>
        ) : null}

        {type === "feeding" ? (
          <>
            <Form.Item name="feedingId" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="mode" label={null} style={{ marginBottom: 14 }}>
              <FeedingModePills />
            </Form.Item>

            {feedingNursing ? (
              <>
                <div className="sleepActionRow">
                  {feedingInProgress ? (
                    <Button
                      danger
                      onClick={async () => {
                        const id = form.getFieldValue("feedingId");
                        if (id) await onFeedingCancel(id);
                        form.setFieldsValue({ feedingId: undefined, startTime: undefined, endTime: undefined });
                        setFeedingRunning(false);
                      }}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      onClick={() => {
                        const now = dayjs();
                        form.setFieldsValue({ startTime: now, endTime: undefined });
                        setClockNow(now);
                        setFeedingRunning(true);
                        persistFeedingStart(now);
                      }}
                    >
                      Start now
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      const now = dayjs();
                      form.setFieldsValue({ endTime: now });
                      setClockNow(now);
                      setFeedingRunning(false);
                    }}
                    disabled={!feedingStartTime}
                  >
                    Finish
                  </Button>
                </div>
                <Form.Item name="startTime" label="Start" rules={[{ required: true }]}>
                  <NativeTimeInput
                    onChange={(value) => {
                      if (!value) return;
                      setFeedingRunning(!form.getFieldValue("endTime"));
                      persistFeedingStart(value);
                    }}
                  />
                </Form.Item>
                <Form.Item name="endTime" label="End" rules={[{ required: true }]}>
                  <NativeTimeInput />
                </Form.Item>
                <div className={feedingInProgress ? "sleepTimer active" : "sleepTimer"}>
                  <span>{feedingInProgress ? "Nursing" : "Total nursing"}</span>
                  <strong>
                    {feedingInProgress ? <Spin size="small" /> : null}
                    {feedingDuration}
                  </strong>
                </div>
              </>
            ) : (
              <>
                <Form.Item name="time" label="Time" rules={[{ required: true }]}>
                  <NativeTimeInput />
                </Form.Item>
                <Form.Item name="source" label="Type" rules={[{ required: true }]}>
                  <Radio.Group
                    className="feedingSourceRadio"
                    options={[
                      { label: "Breast Milk", value: "breastmilk" },
                      { label: "Formula", value: "formula" },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="volumeMl" label="Amount" rules={[{ required: true }]}>
                  <InputNumber addonAfter="ml" min={1} style={{ width: "100%" }} />
                </Form.Item>
              </>
            )}
          </>
        ) : null}

        {type === "diaper" ? (
          <>
            <div className="diaperQuickRow">
              <Button
                size="small"
                onClick={() => form.setFieldValue("time", dayjs())}
              >
                Now
              </Button>
              <Button
                size="small"
                disabled={!latestBathTime}
                onClick={() => {
                  if (!latestBathTime) return;
                  form.setFieldValue("time", dayjs(latestBathTime).subtract(5, "minute"));
                }}
              >
                Before bath
              </Button>
              <Button
                size="small"
                disabled={!latestFeedingTime}
                onClick={() => {
                  if (!latestFeedingTime) return;
                  form.setFieldValue("time", dayjs(latestFeedingTime).subtract(5, "minute"));
                }}
              >
                Before feeding
              </Button>
            </div>
            <Form.Item name="time" label="Time" rules={[{ required: true }]}>
              <NativeTimeInput />
            </Form.Item>
            <Form.Item name="diaperType" label="Type">
              <Radio.Group optionType="button" buttonStyle="solid" options={[{ label: "Wet", value: "wet" }, { label: "Dirty", value: "dirty" }, { label: "Mix", value: "mix" }, { label: "Dry", value: "dry" }]} />
            </Form.Item>
            <Form.Item name="cream" label="Diaper cream">
              <Radio.Group optionType="button" options={[{ label: "Assadura", value: "assadura" }, { label: "Hipoglos", value: "hipoglos" }, { label: "None", value: undefined }]} />
            </Form.Item>
          </>
        ) : null}

        {type === "pump" ? (
          <>
            <Form.Item name="startTime" label="Start" rules={[{ required: true }]}>
              <NativeTimeInput />
            </Form.Item>
            <Form.Item name="endTime" label="End" rules={[{ required: true }]}>
              <NativeTimeInput />
            </Form.Item>
            <Form.Item name="side" label="Breast">
              <Radio.Group optionType="button" buttonStyle="solid" options={[{ label: "Left", value: "left" }, { label: "Right", value: "right" }]} />
            </Form.Item>
            <Form.Item name="volumeMl" label="Volume">
              <InputNumber addonAfter="ml" min={0} style={{ width: "100%" }} />
            </Form.Item>
          </>
        ) : null}

        {type === "medicine" ? (
          <>
            <Form.Item name="time" label="Time" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="name" label="Medication" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
              <InputNumber addonAfter={<Form.Item name="unit" noStyle><Select style={{ width: 82 }} options={[{ value: "ml", label: "ml" }, { value: "drops", label: "drops" }, { value: "tsp", label: "tsp" }]} /></Form.Item>} min={0} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </>
        ) : null}

        {type === "bath" ? (
          <Form.Item name="time" label="Time" rules={[{ required: true }]}>
            <NativeTimeInput />
          </Form.Item>
        ) : null}

        {type === "outing" ? (
          <>
            <Form.Item name="startTime" label="Start" rules={[{ required: true }]}>
              <NativeTimeInput />
            </Form.Item>
            <Form.Item name="endTime" label="End" rules={[{ required: true }]}>
              <NativeTimeInput />
            </Form.Item>
            <Form.Item name="place" label="Place">
              <Input />
            </Form.Item>
          </>
        ) : null}

        {type === "growth" ? (
          <>
            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="weightKg" label="Weight">
              <InputNumber addonAfter="kg" min={0} step={0.01} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="heightCm" label="Height">
              <InputNumber addonAfter="cm" min={0} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="headCm" label="Head">
              <InputNumber addonAfter="cm" min={0} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </>
        ) : null}

        {type !== "sleep" && type !== "outing" && !(type === "feeding" && feedingNursing) ? (
          <Form.Item name="notes" label="Notes">
            <Input />
          </Form.Item>
        ) : null}
        <div className="modalActions">
          <Button className="entrySave modalSave" htmlType="submit">
            {isEditing ? "Update" : "Save"}
          </Button>
          {isEditing ? (
            <Button className="modalDelete" danger onClick={onDelete}>
              Delete
            </Button>
          ) : null}
        </div>
      </Form>
    </Modal>
  );
}
