import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { useRouter } from "next/router";
import { Button, Checkbox, Col, DatePicker, Form, Input, InputNumber, Modal, Radio, Row, Space, Spin, Typography } from "antd";
import dayjs from "dayjs";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Bath, CalendarDays, Gamepad2, Moon, Pill, Trees } from "lucide-react";
import AppShell from "@/components/AppShell";
import { BottleIcon, DiaperIcon, PumpBottleIcon } from "@/components/icons";
import DailySummary from "@/components/DailySummary";
import QuickAddGrid from "@/components/QuickAddGrid";
import Timeline, { TimelineSortOrder, buildTimelineRows, timelineMetricStyles } from "@/components/Timeline";
import { useData } from "@/context/DataContext";
import { formatDuration, newId, todayRange } from "@/lib/format";
import type { DiaperCream, DiaperEntry, DiaperType } from "@/lib/types";

type RecordType = "sleep" | "feeding" | "diaper" | "pump" | "medicine" | "growth" | "bath" | "playtime" | "outing";

const metricStyles = timelineMetricStyles;

function timeOnDate(value: dayjs.Dayjs, baseSource?: string | dayjs.Dayjs | null) {
  const base = baseSource ? dayjs(baseSource) : dayjs();
  return base
    .hour(value.hour())
    .minute(value.minute())
    .second(0)
    .millisecond(0);
}

function timeOnToday(value: dayjs.Dayjs) {
  return timeOnDate(value);
}

function timeRangeOnDate(startValue: dayjs.Dayjs, endValue: dayjs.Dayjs, baseSource?: string | dayjs.Dayjs | null) {
  const rangeStart = timeOnDate(startValue, baseSource);
  let rangeEnd = timeOnDate(endValue, baseSource);
  if (rangeEnd.isBefore(rangeStart) || rangeEnd.isSame(rangeStart)) rangeEnd = rangeEnd.add(1, "day");
  return [rangeStart, rangeEnd] as const;
}

function timeRangeOnToday(startValue: dayjs.Dayjs, endValue: dayjs.Dayjs) {
  return timeRangeOnDate(startValue, endValue);
}

function buildDiaperPayload(
  values: { time: dayjs.Dayjs; diaperType: DiaperType; cream?: DiaperCream },
  baseSource?: string | dayjs.Dayjs | null,
) {
  return {
    time: timeOnDate(values.time, baseSource).toISOString(),
    type: values.diaperType,
    cream: values.cream,
  };
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
    if (digits.length < 3) {
      setDraft(digits);
      onChange?.(undefined);
      return;
    }
    const hourDigits = digits.length <= 3 ? digits.slice(0, 1) : digits.slice(0, 2);
    const minuteDigits = digits.length <= 3 ? digits.slice(1) : digits.slice(2);
    const hour = Math.min(Number(hourDigits), 23);
    const minute = Math.min(Number(minuteDigits.padEnd(2, "0")), 59);
    const formatted = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    setDraft(formatted);
    onChange?.(dayjs().hour(hour).minute(minute).second(0).millisecond(0));
  };

  return (
    <input
      className="nativeTimeInput"
      type="text"
      inputMode="numeric"
      placeholder="HH:mm"
      value={draft}
      onChange={(event) => {
        const raw = event.target.value;
        const digits = raw.replace(/\D/g, "").slice(0, 4);
        const next = raw.includes(":")
          ? raw.replace(/[^\d:]/g, "").slice(0, 5)
          : digits.length > 2
            ? `${digits.slice(0, -2)}:${digits.slice(-2)}`
            : digits;
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
  const router = useRouter();
  const { data, loading, refresh, add, update, remove } = useData();
  const [activeModal, setActiveModal] = useState<RecordType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalDefaults, setModalDefaults] = useState<{ feedingEndTime?: string; diaperTime?: string; time?: string }>({});
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDefaultTime, setQuickAddDefaultTime] = useState<string | undefined>(undefined);
  const [timelineSortOrder, setTimelineSortOrder] = useState<TimelineSortOrder>("desc");
  const [start, end] = useMemo(() => todayRange(), []);
  const todayLabel = useMemo(() => dayjs().format("MMMM D, YYYY"), []);

  const editingEntry = useMemo(() => {
    if (!activeModal || !editingId) return null;
    const list = (data as any)[activeModal] as any[] | undefined;
    return list?.find((entry) => entry.id === editingId) ?? null;
  }, [activeModal, editingId, data]);

  const pairedBathDiaper = useMemo(() => {
    if (activeModal !== "bath" || !editingEntry?.time) return undefined;
    return data.diaper.find((entry) => dayjs(entry.time).isSame(dayjs(editingEntry.time), "minute"));
  }, [activeModal, editingEntry, data.diaper]);

  const openModal = (type: RecordType, id: string | null = null, defaults: { feedingEndTime?: string; diaperTime?: string; time?: string } = {}) => {
    if (!id && (type === "sleep" || type === "feeding")) {
      const ongoing = type === "sleep"
        ? data.sleep.find((entry) => !entry.end)
        : data.feeding.find((entry) => entry.kind === "nursing" && !entry.end && !entry.durationMin);
      if (ongoing) {
        Modal.confirm({
          title: type === "sleep" ? "Sleep already in progress" : "Feeding already in progress",
          content: `There is already an ongoing ${type === "sleep" ? "sleep" : "feeding"} activity. What would you like to do?`,
          okText: "Go to current activity",
          cancelText: "Overwrite",
          closable: false,
          maskClosable: false,
          centered: true,
          okButtonProps: { className: "entrySave" },
          onOk: () => {
            setModalDefaults(defaults);
            setActiveModal(type);
            setEditingId(ongoing.id);
          },
          onCancel: async () => {
            await remove(type, ongoing.id, { silent: true });
            setModalDefaults(defaults);
            setActiveModal(type);
            setEditingId(null);
          },
        });
        return;
      }
    }
    setModalDefaults(defaults);
    setActiveModal(type);
    setEditingId(id);
  };

  const openQuickAdd = (defaultTime?: string) => {
    setQuickAddDefaultTime(defaultTime);
    setQuickAddOpen(true);
  };

  const handleQuickAddSelect = (type: RecordType) => {
    const defaults: { time?: string; feedingEndTime?: string; diaperTime?: string } = {};
    if (quickAddDefaultTime) {
      if (type === "diaper") defaults.diaperTime = quickAddDefaultTime;
      else defaults.time = quickAddDefaultTime;
    }
    setQuickAddOpen(false);
    setQuickAddDefaultTime(undefined);
    openModal(type, null, defaults);
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingId(null);
    setModalDefaults({});
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: RecordType; id?: string | null; defaults?: { feedingEndTime?: string; diaperTime?: string; time?: string } }>).detail;
      if (!detail?.type) return;
      openModal(detail.type, detail.id ?? null, detail.defaults ?? {});
    };
    document.addEventListener("baby-diary-open-modal", handler);
    return () => document.removeEventListener("baby-diary-open-modal", handler);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const { edit, quickAdd } = router.query;
    const editStr = Array.isArray(edit) ? edit[0] : edit;
    const quickAddStr = Array.isArray(quickAdd) ? quickAdd[0] : quickAdd;
    if (editStr) {
      const [type, id] = editStr.split(":");
      if (type && id) openModal(type as RecordType, id);
    } else if (quickAddStr) {
      openQuickAdd(quickAddStr);
    }
    if (editStr || quickAddStr) {
      router.replace(router.pathname === "/home" ? "/home" : "/", undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.edit, router.query.quickAdd]);

  const latestGrowth = useMemo(() => [...data.growth].sort((a, b) => b.date.localeCompare(a.date))[0], [data.growth]);

  const timeline = useMemo(() => {
    const rows = buildTimelineRows(data);
    return rows
      .filter((row) => {
        const anchor = dayjs(row.windowAnchor);
        return anchor.isAfter(start) && anchor.isBefore(end);
      })
  }, [data, start, end]);

  const growthChart = useMemo(
    () =>
      [...data.growth]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => ({ date: dayjs(entry.date).format("MMM D"), weight: entry.weightKg ?? 0 })),
    [data.growth],
  );

  return (
    <AppShell title="Emma" subtitle="3 months, 12 days" onAddClick={() => openQuickAdd()}>
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

        <DailySummary
          data={data}
          start={start}
          end={end}
          title="Today's Summary"
          label={todayLabel}
        />
        <section className="panel mobileQuickPanel">
          <Typography.Title level={5} style={{ margin: 0 }}>Quick Add</Typography.Title>
          <Typography.Text type="secondary">Tap to add</Typography.Text>
          <QuickAddGrid onSelect={(type) => openModal(type as RecordType)} />
        </section>

        <section className="panel todayTimelinePanel">
          <div className="mobileSectionHeader">
            <Typography.Title level={5} style={{ margin: 0 }}>Today's Timeline</Typography.Title>
            <span>{todayLabel}</span>
          </div>
          <Timeline
            entries={timeline}
            onEdit={(entry) => openModal(entry.recordType as RecordType, entry.recordId)}
            onAddBetween={(iso) => openQuickAdd(iso)}
            showSortControl
            sortOrder={timelineSortOrder}
            onSortOrderChange={setTimelineSortOrder}
          />
        </section>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <section className="panel desktopOnlyPanel">
              <Typography.Title level={4}>Growth</Typography.Title>
              <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col span={8}><strong>{latestGrowth?.weightKg ?? 0} kg</strong><br /><Typography.Text type="secondary">Weight</Typography.Text></Col>
                <Col span={8}><strong>{latestGrowth?.heightCm ?? 0} cm</strong><br /><Typography.Text type="secondary">Height</Typography.Text></Col>
                <Col span={8}><strong>{latestGrowth?.headCm ?? 0} cm</strong><br /><Typography.Text type="secondary">Head</Typography.Text></Col>
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
      <Modal
        open={quickAddOpen}
        centered
        footer={null}
        maskClosable={false}
        keyboard={false}
        onCancel={() => {
          setQuickAddOpen(false);
          setQuickAddDefaultTime(undefined);
        }}
        title={<strong>Quick Add</strong>}
        className="addRecordModal quickAddModal"
      >
        <QuickAddGrid onSelect={(type) => handleQuickAddSelect(type as RecordType)} />
        <div className="modalActions" style={{ marginTop: 12 }}>
          <Button
            className="modalClose"
            onClick={() => {
              setQuickAddOpen(false);
              setQuickAddDefaultTime(undefined);
            }}
          >
            Close
          </Button>
        </div>
      </Modal>
      <AddRecordModal
        type={activeModal}
        editingEntry={editingEntry}
        pairedBathDiaper={pairedBathDiaper}
        latestBathTime={[...data.bath].sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf())[0]?.time}
        latestFeedingTime={[...data.feeding]
          .map((entry) => (entry.kind === "nursing" ? entry.end ?? entry.time : entry.time))
          .sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf())[0]}
        defaultFeedingEndTime={modalDefaults.feedingEndTime}
        defaultDiaperTime={modalDefaults.diaperTime}
        defaultTime={modalDefaults.time}
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
          await remove("sleep", id, { silent: true });
        }}
        onFeedingCancel={async (id) => {
          await remove("feeding", id, { silent: true });
        }}
        onSubmit={async (type, values) => {
          const editId: string | undefined = editingId ?? undefined;
          if (type === "sleep") {
            const liveSleep = data.sleep.find((entry) => entry.id === values.sleepId);
            const baseSource = editingEntry?.start ?? liveSleep?.start ?? modalDefaults.time;
            const baseDay = baseSource
              ? dayjs(baseSource).startOf("day")
              : dayjs().startOf("day");
            let sleepStart = baseDay
              .hour(values.startTime.hour())
              .minute(values.startTime.minute())
              .second(0)
              .millisecond(0);
            let sleepEnd: dayjs.Dayjs | undefined;
            if (values.endTime) {
              sleepEnd = baseDay
                .hour(values.endTime.hour())
                .minute(values.endTime.minute())
                .second(0)
                .millisecond(0);
              if (sleepEnd.isBefore(sleepStart) || sleepEnd.isSame(sleepStart)) sleepEnd = sleepEnd.add(1, "day");
            }
            if (!baseSource && sleepEnd) {
              const now = dayjs();
              if (sleepStart.isAfter(now) && sleepEnd.isAfter(now)) {
                sleepStart = sleepStart.subtract(1, "day");
                sleepEnd = sleepEnd.subtract(1, "day");
              }
            }
            const targetId = editId ?? values.sleepId;
            const conflict = sleepEnd
              ? data.sleep.find((s) => {
                  if (s.id === targetId) return false;
                  if (!s.end) return false;
                  const sStart = dayjs(s.start);
                  const sEnd = dayjs(s.end);
                  return sleepStart.isBefore(sEnd) && sStart.isBefore(sleepEnd);
                })
              : undefined;
            if (conflict) {
              Modal.error({
                title: "Sleep conflict",
                content: `This sleep overlaps another sleep at ${dayjs(conflict.start).format("HH:mm")} - ${dayjs(conflict.end!).format("HH:mm")}. Please check the timeline before saving.`,
                okText: "OK",
              });
              return;
            }
            if (targetId) {
              await update("sleep", targetId, {
                start: sleepStart.toISOString(),
                end: sleepEnd ? sleepEnd.toISOString() : null,
              });
            } else {
              await add("sleep", { id: newId(), start: sleepStart.toISOString(), end: sleepEnd?.toISOString() });
            }
          }
          if (type === "feeding") {
            if (values.mode === "breast") {
              const liveFeeding = data.feeding.find((entry) => entry.id === values.feedingId);
              const baseSource = editingEntry?.time ?? liveFeeding?.time ?? modalDefaults.time ?? modalDefaults.feedingEndTime;
              const baseDay = baseSource
                ? dayjs(baseSource).startOf("day")
                : dayjs().startOf("day");
              let feedStart = baseDay
                .hour(values.startTime.hour())
                .minute(values.startTime.minute())
                .second(0)
                .millisecond(0);
              let feedEnd: dayjs.Dayjs | undefined;
              if (values.endTime) {
                feedEnd = baseDay
                  .hour(values.endTime.hour())
                  .minute(values.endTime.minute())
                  .second(0)
                  .millisecond(0);
                if (feedEnd.isBefore(feedStart) || feedEnd.isSame(feedStart)) feedEnd = feedEnd.add(1, "day");
              }
              if (!baseSource && feedEnd) {
                const now = dayjs();
                if (feedStart.isAfter(now) && feedEnd.isAfter(now)) {
                  feedStart = feedStart.subtract(1, "day");
                  feedEnd = feedEnd.subtract(1, "day");
                }
              }
              const durationMin = feedEnd ? feedEnd.diff(feedStart, "minute") : undefined;
              const targetId = editId ?? values.feedingId;
              const conflict = feedEnd
                ? data.feeding.find((f) => {
                    if (f.id === targetId) return false;
                    if (f.kind !== "nursing") return false;
                    if (!f.end) return false;
                    const fStart = dayjs(f.time);
                    const fEnd = dayjs(f.end);
                    return feedStart.isBefore(fEnd) && fStart.isBefore(feedEnd);
                  })
                : undefined;
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
                end: feedEnd ? feedEnd.toISOString() : undefined,
                durationMin: durationMin ?? undefined,
              };
              if (targetId) {
                await update("feeding", targetId, payload);
              } else {
                await add("feeding", { id: newId(), ...payload });
            }
          } else {
              const baseSource = editingEntry?.time ?? modalDefaults.time;
              const payload = {
                time: timeOnDate(values.time, baseSource).toISOString(),
                kind: "bottle" as const,
                source: values.source,
                volumeMl: values.volumeMl,
              };
              if (editId) {
                await update("feeding", editId, payload);
              } else {
                await add("feeding", { id: newId(), ...payload });
              }
            }
          }
          if (type === "diaper") {
            const baseSource = editingEntry?.time ?? modalDefaults.diaperTime ?? modalDefaults.time;
            const payload = buildDiaperPayload(values, baseSource);
            if (editId) {
              await update("diaper", editId, payload);
            } else {
              await add("diaper", { id: newId(), ...payload });
            }
          }
          if (type === "pump") {
            const baseSource = editingEntry?.start ?? modalDefaults.time;
            const [pumpStart, pumpFinish] = timeRangeOnDate(values.startTime, values.endTime, baseSource);
            const payload = {
              side: values.side,
              start: pumpStart.toISOString(),
              finish: pumpFinish.toISOString(),
              volumeMl: values.volumeMl,
            };
            if (editId) {
              await update("pump", editId, payload);
            } else {
              await add("pump", { id: newId(), ...payload });
            }
          }
          if (type === "medicine") {
            const doses = (values.medicines ?? [])
              .map((value: string) => value?.trim())
              .filter(Boolean)
              .map((name: string) => ({ name }));
            const baseSource = editingEntry?.time ?? modalDefaults.time;
            const payload = {
              time: timeOnDate(values.time, baseSource).toISOString(),
              doses,
            };
            if (editId) {
              await update("medicine", editId, payload);
            } else {
              await add("medicine", { id: newId(), ...payload });
            }
          }
          if (type === "playtime") {
            const baseSource = editingEntry?.time ?? modalDefaults.time;
            const payload = { time: timeOnDate(values.time, baseSource).toISOString() };
            if (editId) {
              await update("playtime", editId, payload);
            } else {
              await add("playtime", { id: newId(), ...payload });
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
            const baseSource = editingEntry?.time ?? modalDefaults.time;
            const bathTime = timeOnDate(values.time, baseSource);
            const payload = { time: bathTime.toISOString() };
            if (editId) {
              await update("bath", editId, payload);
            } else {
              await add("bath", { id: newId(), ...payload });
            }
            if (values.addDiaperChange) {
              const diaperPayload = buildDiaperPayload({
                time: values.diaperTime ?? values.time,
                diaperType: values.bathDiaperType,
                cream: values.bathDiaperCream,
              }, pairedBathDiaper?.time ?? baseSource);
              if (pairedBathDiaper?.id) {
                await update("diaper", pairedBathDiaper.id, diaperPayload, { silent: true });
              } else {
                await add("diaper", { id: newId(), ...diaperPayload }, { silent: true });
              }
            }
          }
          if (type === "outing") {
            const baseSource = editingEntry?.start ?? editingEntry?.time ?? modalDefaults.time;
            const [outingStart, outingEnd] = timeRangeOnDate(values.startTime, values.endTime, baseSource);
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

function DiaperFields({
  timeName = "time",
  typeName = "diaperType",
  creamName = "cream",
  showQuickActions = false,
  latestBathTime,
  latestFeedingTime,
  onNow,
  onBeforeBath,
  onBeforeFeeding,
}: {
  timeName?: string;
  typeName?: string;
  creamName?: string;
  showQuickActions?: boolean;
  latestBathTime?: string;
  latestFeedingTime?: string;
  onNow?: () => void;
  onBeforeBath?: () => void;
  onBeforeFeeding?: () => void;
}) {
  return (
    <>
      {showQuickActions ? (
        <div className="diaperQuickRow">
          <Button size="small" onClick={onNow}>
            Now
          </Button>
          <Button size="small" disabled={!latestBathTime} onClick={onBeforeBath}>
            Before bath
          </Button>
          <Button size="small" disabled={!latestFeedingTime} onClick={onBeforeFeeding}>
            Before feeding
          </Button>
        </div>
      ) : null}
      <Form.Item name={timeName} label="Time" rules={[{ required: true }]}>
        <NativeTimeInput />
      </Form.Item>
      <Form.Item name={typeName} label="Type">
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: "Wet", value: "wet" },
            { label: "Dirty", value: "dirty" },
            { label: "Mix", value: "mix" },
            { label: "Dry", value: "dry" },
          ]}
        />
      </Form.Item>
      <Form.Item name={creamName} label="Diaper cream">
        <Radio.Group
          optionType="button"
          options={[
            { label: "Assadura", value: "assadura" },
            { label: "Hipoglos", value: "hipoglos" },
            { label: "Both", value: "both" },
            { label: "None", value: undefined },
          ]}
        />
      </Form.Item>
    </>
  );
}

function AddRecordModal({
  type,
  editingEntry,
  pairedBathDiaper,
  latestBathTime,
  latestFeedingTime,
  defaultFeedingEndTime,
  defaultDiaperTime,
  defaultTime,
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
  pairedBathDiaper?: DiaperEntry;
  latestBathTime?: string;
  latestFeedingTime?: string;
  defaultFeedingEndTime?: string;
  defaultDiaperTime?: string;
  defaultTime?: string;
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
  const addDiaperChange = Form.useWatch("addDiaperChange", form);

  const meta = {
    sleep: { title: "Sleep", icon: <Moon size={22} />, tone: "sleep" },
    feeding: { title: "Feeding", icon: <BottleIcon size={22} />, tone: "feed" },
    diaper: { title: "Diaper", icon: <DiaperIcon size={22} />, tone: "diaper" },
    pump: { title: "Pumping", icon: <PumpBottleIcon size={22} />, tone: "pump" },
    medicine: { title: "Medicine", icon: <Pill size={22} />, tone: "med" },
    growth: { title: "Growth", icon: <BarChart3 size={22} />, tone: "sleep" },
    bath: { title: "Bath", icon: <Bath size={22} />, tone: "bath" },
    playtime: { title: "Playtime", icon: <Gamepad2 size={22} />, tone: "play" },
    outing: { title: "Outing", icon: <Trees size={22} />, tone: "outing" },
  };

  const getInitialValues = () => {
    const now = dayjs();
    return {
      time: now,
      start: undefined,
      startTime: undefined,
      end: now.add(30, "minute"),
      endTime: undefined,
      finish: now.add(15, "minute"),
      date: now,
      mode: "breast",
      side: "left",
      source: "breastmilk",
      diaperType: "wet",
      cream: undefined,
      addDiaperChange: false,
      diaperTime: now,
      bathDiaperType: "wet",
      bathDiaperCream: undefined,
      unit: "ml",
      name: undefined,
      medicines: [""],
    };
  };

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

  const closePersistingDraft = async () => {
    onClose();
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
      maskClosable={false}
      keyboard={false}
      onCancel={closePersistingDraft}
      className={`addRecordModal tone-${current.tone}${type === "sleep" ? " sleepModal" : ""}`}
      title={
        <div className="modalTitle" style={metricStyles[current.tone]}>
          <span>{current.icon}</span>
          <strong>{current.title}</strong>
        </div>
      }
      afterOpenChange={(open) => {
        if (open) {
          const initialValues = getInitialValues();
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
              }
            } else if (type === "diaper") {
              overrides.time = dayjs(editingEntry.time);
              overrides.diaperType = editingEntry.type;
              overrides.cream = editingEntry.cream;
            } else if (type === "pump") {
              startTime = dayjs(editingEntry.start);
              endTime = dayjs(editingEntry.finish);
              overrides.side = editingEntry.side;
              overrides.volumeMl = editingEntry.volumeMl;
            } else if (type === "medicine") {
              overrides.time = dayjs(editingEntry.time);
              overrides.medicines = editingEntry.doses?.length
                ? editingEntry.doses.map((dose: any) => `${dose.name}${dose.amount ? ` - ${dose.amount} ${dose.unit ?? ""}` : ""}`)
                : [""];
            } else if (type === "growth") {
              overrides.date = dayjs(editingEntry.date);
              overrides.heightCm = editingEntry.heightCm;
              overrides.weightKg = editingEntry.weightKg;
              overrides.headCm = editingEntry.headCm;
            } else if (type === "bath") {
              overrides.time = dayjs(editingEntry.time);
              if (pairedBathDiaper) {
                overrides.addDiaperChange = true;
                overrides.diaperTime = dayjs(pairedBathDiaper.time);
                overrides.bathDiaperType = pairedBathDiaper.type;
                overrides.bathDiaperCream = pairedBathDiaper.cream;
              }
            } else if (type === "playtime") {
              overrides.time = dayjs(editingEntry.time);
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
            } else if (type === "feeding" && defaultFeedingEndTime) {
              endTime = dayjs(defaultFeedingEndTime);
              mode = "breast";
            } else if (type === "diaper" && defaultDiaperTime) {
              overrides.time = dayjs(defaultDiaperTime);
            } else if (defaultTime) {
              const dt = dayjs(defaultTime);
              if (type === "sleep") {
                startTime = dt;
              } else if (type === "feeding") {
                overrides.time = dt;
                mode = "bottle";
              } else if (type === "pump") {
                overrides.start = dt;
                overrides.finish = dt.add(15, "minute");
              } else if (type === "bath" || type === "diaper" || type === "medicine" || type === "playtime") {
                overrides.time = dt;
              } else if (type === "outing") {
                overrides.start = dt;
              }
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
      <Form form={form} layout="vertical" initialValues={getInitialValues()} onFinish={(values) => (type ? onSubmit(type, values) : undefined)}>
        {type === "sleep" ? (
          <>
            <Form.Item name="sleepId" hidden>
              <Input />
            </Form.Item>
            <div className="diaperQuickRow">
              <Button
                size="small"
                onClick={() => {
                  const startTime = form.getFieldValue("startTime");
                  onClose();
                  window.setTimeout(() => {
                    document.dispatchEvent(new CustomEvent("baby-diary-open-modal", {
                      detail: {
                        type: "feeding",
                        defaults: startTime ? { feedingEndTime: startTime.toISOString() } : {},
                      },
                    }));
                  }, 0);
                }}
              >
                Add feeding before
              </Button>
              <Button
                size="small"
                onClick={() => {
                  const startTime = form.getFieldValue("startTime");
                  const baseAbs = sleepStartAbsolute ?? (startTime ? timeOnToday(startTime) : dayjs());
                  onClose();
                  window.setTimeout(() => {
                    document.dispatchEvent(new CustomEvent("baby-diary-open-modal", {
                      detail: {
                        type: "diaper",
                        defaults: { diaperTime: baseAbs.subtract(5, "minute").toISOString() },
                      },
                    }));
                  }, 0);
                }}
              >
                Diaper before sleep
              </Button>
              <Button
                size="small"
                onClick={() => {
                  const endTime = form.getFieldValue("endTime");
                  const baseAbs = sleepEndAbsolute ?? (endTime ? timeOnToday(endTime) : dayjs());
                  onClose();
                  window.setTimeout(() => {
                    document.dispatchEvent(new CustomEvent("baby-diary-open-modal", {
                      detail: {
                        type: "diaper",
                        defaults: { diaperTime: baseAbs.add(5, "minute").toISOString() },
                      },
                    }));
                  }, 0);
                }}
              >
                Diaper after sleep
              </Button>
            </div>
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
              <NativeTimeInput />
            </Form.Item>
            <Form.Item name="endTime" label="End">
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
            <div className="diaperQuickRow">
              <Button
                size="small"
                onClick={() => {
                  const feedingStart = form.getFieldValue("startTime") ?? form.getFieldValue("time") ?? dayjs();
                  onClose();
                  window.setTimeout(() => {
                    document.dispatchEvent(new CustomEvent("baby-diary-open-modal", {
                      detail: {
                        type: "diaper",
                        defaults: { diaperTime: dayjs(feedingStart).subtract(5, "minute").toISOString() },
                      },
                    }));
                  }, 0);
                }}
              >
                Add diaper before
              </Button>
              <Button
                size="small"
                onClick={() => {
                  const feedingEnd = form.getFieldValue("endTime") ?? form.getFieldValue("time") ?? dayjs();
                  onClose();
                  window.setTimeout(() => {
                    document.dispatchEvent(new CustomEvent("baby-diary-open-modal", {
                      detail: {
                        type: "diaper",
                        defaults: { diaperTime: dayjs(feedingEnd).add(5, "minute").toISOString() },
                      },
                    }));
                  }, 0);
                }}
              >
                Add diaper after
              </Button>
            </div>

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
                  <NativeTimeInput />
                </Form.Item>
                <Form.Item name="endTime" label="End">
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
          <DiaperFields
            showQuickActions
            latestBathTime={latestBathTime}
            latestFeedingTime={latestFeedingTime}
            onNow={() => form.setFieldValue("time", dayjs())}
            onBeforeBath={() => {
              if (!latestBathTime) return;
              form.setFieldValue("time", dayjs(latestBathTime).subtract(5, "minute"));
            }}
            onBeforeFeeding={() => {
              if (!latestFeedingTime) return;
              form.setFieldValue("time", dayjs(latestFeedingTime).subtract(5, "minute"));
            }}
          />
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
              <NativeTimeInput />
            </Form.Item>
            <Form.List name="medicines">
              {(fields, { add, remove }) => (
                <div className="medicineList">
                  {fields.map((field, index) => (
                    <div className="medicineListItem" key={field.key}>
                      <Form.Item
                        {...field}
                        label={index === 0 ? "Medicines" : " "}
                        rules={[{ required: true, whitespace: true, message: "Enter a medicine" }]}
                      >
                        <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} placeholder="Medicine name, dose, or note" />
                      </Form.Item>
                      {fields.length > 1 ? (
                        <Button type="text" danger onClick={() => remove(field.name)} aria-label="Remove medicine">
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add("")} block>
                    Add another medicine
                  </Button>
                </div>
              )}
            </Form.List>
          </>
        ) : null}

        {type === "bath" ? (
          <>
            <Form.Item name="time" label="Time" rules={[{ required: true }]}>
              <NativeTimeInput />
            </Form.Item>
            <Form.Item name="addDiaperChange" valuePropName="checked" className="pairedEntryToggle">
              <Checkbox
                onChange={(event) => {
                  if (event.target.checked) {
                    form.setFieldsValue({
                      diaperTime: form.getFieldValue("time") ?? dayjs(),
                      bathDiaperType: form.getFieldValue("bathDiaperType") ?? "wet",
                    });
                  }
                }}
              >
                Add diaper change too
              </Checkbox>
            </Form.Item>
            {addDiaperChange ? (
              <div className="pairedEntryFields">
                <DiaperFields timeName="diaperTime" typeName="bathDiaperType" creamName="bathDiaperCream" />
              </div>
            ) : null}
          </>
        ) : null}

        {type === "playtime" ? (
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

        <div className="modalActions">
          <Button className="entrySave modalSave" htmlType="submit">
            {isEditing ? "Update" : "Save"}
          </Button>
          <Button className="modalClose" onClick={closePersistingDraft}>
            Close
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
