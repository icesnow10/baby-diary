import { useMemo } from "react";
import { Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import AppShell from "@/components/AppShell";
import { useData } from "@/context/DataContext";
import { formatDuration } from "@/lib/format";

type HistoryRow = {
  id: string;
  time: string;
  type: string;
  details: string;
};

export default function HistoryPage() {
  const { data } = useData();

  const rows = useMemo<HistoryRow[]>(() => {
    const all: HistoryRow[] = [
      ...data.sleep.map((entry) => ({
        id: `sleep-${entry.id}`,
        time: entry.start,
        type: "Sleep",
        details: `${dayjs(entry.start).format("HH:mm")} - ${dayjs(entry.end).format("HH:mm")} (${formatDuration(entry.start, entry.end)})`,
      })),
      ...data.feeding.map((entry) => ({
        id: `feeding-${entry.id}`,
        time: entry.time,
        type: "Feeding",
        details: entry.kind === "nursing" ? `${entry.side} breast, ${entry.durationMin ?? 0} min` : `${entry.source}, ${entry.volumeMl ?? 0} ml`,
      })),
      ...data.diaper.map((entry) => ({
        id: `diaper-${entry.id}`,
        time: entry.time,
        type: "Diaper",
        details: `${entry.type}${entry.cream ? `, ${entry.cream}` : ""}`,
      })),
      ...data.pump.map((entry) => ({
        id: `pump-${entry.id}`,
        time: entry.start,
        type: "Pumping",
        details: `${entry.side} ${formatDuration(entry.start, entry.finish)}${entry.volumeMl ? `, ${entry.volumeMl} ml` : ""}`,
      })),
      ...data.medicine.map((entry) => ({
        id: `medicine-${entry.id}`,
        time: entry.time,
        type: "Medicine",
        details: entry.doses.map((dose) => `${dose.name} ${dose.amount} ${dose.unit}`).join(", "),
      })),
    ];

    return all.sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf());
  }, [data]);

  const columns: ColumnsType<HistoryRow> = [
    { title: "Time", dataIndex: "time", render: (value: string) => dayjs(value).format("MMM D, HH:mm") },
    { title: "Type", dataIndex: "type", render: (value: string) => <Tag color="pink">{value}</Tag> },
    { title: "Details", dataIndex: "details" },
  ];

  return (
    <AppShell title="History" subtitle="Recent care entries">
      <section className="panel">
        <Typography.Title level={4}>History</Typography.Title>
        <Table rowKey="id" columns={columns} dataSource={rows} pagination={{ pageSize: 12 }} />
      </section>
    </AppShell>
  );
}
