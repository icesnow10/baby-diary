import { useMemo } from "react";
import { Button, Col, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Baby, Moon, Milk, Pill, Ruler, ClipboardList } from "lucide-react";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { useData } from "@/context/DataContext";
import { durationMinutes, formatDuration, todayRange } from "@/lib/format";

type RecentRow = {
  id: string;
  time: string;
  category: string;
  detail: string;
};

export default function HomePage() {
  const { data, loading, refresh } = useData();
  const [start, end] = todayRange();

  const summary = useMemo(() => {
    const sleepToday = data.sleep
      .filter((entry) => dayjs(entry.start).isAfter(start) && dayjs(entry.start).isBefore(end))
      .reduce((total, entry) => total + durationMinutes(entry.start, entry.end), 0);
    const bottleMl = data.feeding
      .filter((entry) => dayjs(entry.time).isAfter(start) && dayjs(entry.time).isBefore(end))
      .reduce((total, entry) => total + (entry.volumeMl ?? 0), 0);
    const nursingMin = data.feeding
      .filter((entry) => dayjs(entry.time).isAfter(start) && dayjs(entry.time).isBefore(end))
      .reduce((total, entry) => total + (entry.durationMin ?? 0), 0);
    const diapers = data.diaper.filter(
      (entry) => dayjs(entry.time).isAfter(start) && dayjs(entry.time).isBefore(end),
    ).length;
    const medicines = data.medicine.filter(
      (entry) => dayjs(entry.time).isAfter(start) && dayjs(entry.time).isBefore(end),
    ).length;
    const latestGrowth = [...data.growth].sort((a, b) => b.date.localeCompare(a.date))[0];

    return { sleepToday, bottleMl, nursingMin, diapers, medicines, latestGrowth };
  }, [data, start, end]);

  const dailyChart = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const day = dayjs().subtract(6 - index, "day");
      const dayStart = day.startOf("day");
      const dayEnd = day.endOf("day");
      return {
        day: day.format("ddd"),
        sleep:
          Math.round(
            data.sleep
              .filter((entry) => dayjs(entry.start).isAfter(dayStart) && dayjs(entry.start).isBefore(dayEnd))
              .reduce((total, entry) => total + durationMinutes(entry.start, entry.end), 0) / 6,
          ) / 10,
        feeds: data.feeding.filter((entry) => dayjs(entry.time).isAfter(dayStart) && dayjs(entry.time).isBefore(dayEnd))
          .length,
        diapers: data.diaper.filter((entry) => dayjs(entry.time).isAfter(dayStart) && dayjs(entry.time).isBefore(dayEnd))
          .length,
      };
    });
  }, [data]);

  const growthChart = useMemo(
    () =>
      [...data.growth]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => ({
          date: dayjs(entry.date).format("MMM D"),
          weight: entry.weightKg,
          height: entry.heightCm,
          head: entry.headCm,
        })),
    [data.growth],
  );

  const recentRows = useMemo<RecentRow[]>(() => {
    const rows: RecentRow[] = [
      ...data.sleep.map((entry) => ({
        id: `sleep-${entry.id}`,
        time: entry.start,
        category: "Sleep",
        detail: formatDuration(entry.start, entry.end),
      })),
      ...data.feeding.map((entry) => ({
        id: `feeding-${entry.id}`,
        time: entry.time,
        category: "Feeding",
        detail:
          entry.kind === "nursing"
            ? `${entry.side} ${entry.durationMin ?? 0} min`
            : `${entry.source} ${entry.volumeMl ?? 0} ml`,
      })),
      ...data.diaper.map((entry) => ({
        id: `diaper-${entry.id}`,
        time: entry.time,
        category: "Diaper",
        detail: `${entry.type}${entry.cream ? `, ${entry.cream}` : ""}`,
      })),
      ...data.pump.map((entry) => ({
        id: `pump-${entry.id}`,
        time: entry.start,
        category: "Pump",
        detail: `${entry.side} ${formatDuration(entry.start, entry.finish)}${entry.volumeMl ? `, ${entry.volumeMl} ml` : ""}`,
      })),
      ...data.medicine.map((entry) => ({
        id: `medicine-${entry.id}`,
        time: entry.time,
        category: "Medicine",
        detail: entry.doses.map((dose) => `${dose.name} ${dose.amount} ${dose.unit}`).join(", "),
      })),
    ];
    return rows.sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf()).slice(0, 8);
  }, [data]);

  const columns: ColumnsType<RecentRow> = [
    {
      title: "Time",
      dataIndex: "time",
      render: (value: string) => dayjs(value).format("MMM D, HH:mm"),
    },
    {
      title: "Type",
      dataIndex: "category",
      render: (value: string) => <Tag color="cyan">{value}</Tag>,
    },
    { title: "Details", dataIndex: "detail" },
  ];

  return (
    <AppShell title="Baby Diary" subtitle="Daily care dashboard for sleep, feeding, diapers, pumping, growth, and medicine.">
      <Space direction="vertical" size={18} style={{ width: "100%" }}>
        <Row justify="space-between" gutter={[16, 16]} align="middle">
          <Col>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Today
            </Typography.Title>
          </Col>
          <Col>
            <Button onClick={refresh} loading={loading}>
              Refresh
            </Button>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={4}>
            <StatCard icon={<Moon size={20} />} label="Sleep" value={Math.round(summary.sleepToday / 6) / 10} suffix="h" />
          </Col>
          <Col xs={24} sm={12} xl={4}>
            <StatCard icon={<Milk size={20} />} label="Nursing" value={summary.nursingMin} suffix="min" />
          </Col>
          <Col xs={24} sm={12} xl={4}>
            <StatCard icon={<Milk size={20} />} label="Bottle" value={summary.bottleMl} suffix="ml" />
          </Col>
          <Col xs={24} sm={12} xl={4}>
            <StatCard icon={<Baby size={20} />} label="Diapers" value={summary.diapers} />
          </Col>
          <Col xs={24} sm={12} xl={4}>
            <StatCard icon={<Pill size={20} />} label="Medicine" value={summary.medicines} />
          </Col>
          <Col xs={24} sm={12} xl={4}>
            <StatCard
              icon={<Ruler size={20} />}
              label="Latest weight"
              value={summary.latestGrowth?.weightKg ?? 0}
              suffix="kg"
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <section className="panel">
              <Typography.Title level={4}>Last 7 days</Typography.Title>
              <div className="chartBox">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sleep" fill="#4f8a8b" name="Sleep hours" />
                    <Bar dataKey="feeds" fill="#f9a03f" name="Feeds" />
                    <Bar dataKey="diapers" fill="#7a77ff" name="Diapers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </Col>
          <Col xs={24} xl={10}>
            <section className="panel">
              <Typography.Title level={4}>Growth trend</Typography.Title>
              <div className="chartBox">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="weight" stroke="#4f8a8b" name="kg" />
                    <Line type="monotone" dataKey="height" stroke="#f9a03f" name="cm" />
                    <Line type="monotone" dataKey="head" stroke="#7a77ff" name="head cm" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <section className="panel">
              <Typography.Title level={4}>Recent activity</Typography.Title>
              <Table rowKey="id" columns={columns} dataSource={recentRows} pagination={false} size="middle" />
            </section>
          </Col>
          <Col xs={24} xl={10}>
            <section className="panel">
              <Space align="center">
                <ClipboardList size={20} />
                <Typography.Title level={4} style={{ margin: 0 }}>
                  Diaper inventory
                </Typography.Title>
              </Space>
              <div className="chartBox short">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.diaperInventory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="size" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#4f8a8b" fill="#4f8a8b" fillOpacity={0.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </Col>
        </Row>
      </Space>
    </AppShell>
  );
}
