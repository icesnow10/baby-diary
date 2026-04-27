import { useMemo } from "react";
import type React from "react";
import { Button, Col, Row, Space, Typography } from "antd";
import dayjs from "dayjs";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Baby, BriefcaseMedical, CalendarDays, Milk, Moon, Pill, Ruler } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useData } from "@/context/DataContext";
import { durationMinutes, formatDuration, todayRange } from "@/lib/format";

type TimelineRow = {
  id: string;
  time: string;
  title: string;
  detail: string;
  tone: string;
  icon: React.ReactNode;
};

const metricStyles = {
  sleep: { "--metric-bg": "#f8ecff", "--metric-line": "#ecd6ff", "--metric-color": "#9d6ee8" },
  feed: { "--metric-bg": "#fff0f5", "--metric-line": "#ffd5e4", "--metric-color": "#ff5f93" },
  diaper: { "--metric-bg": "#eefdF8", "--metric-line": "#c9f3e5", "--metric-color": "#38bc94" },
  pump: { "--metric-bg": "#eef8ff", "--metric-line": "#cfeeff", "--metric-color": "#5eb1e6" },
  med: { "--metric-bg": "#fff5e8", "--metric-line": "#ffe0b5", "--metric-color": "#ef9634" },
} as Record<string, React.CSSProperties>;

export default function HomePage() {
  const { data, loading, refresh } = useData();
  const [start, end] = todayRange();

  const summary = useMemo(() => {
    const sleepToday = data.sleep
      .filter((entry) => dayjs(entry.start).isAfter(start) && dayjs(entry.start).isBefore(end))
      .reduce((total, entry) => total + durationMinutes(entry.start, entry.end), 0);
    const feeds = data.feeding.filter((entry) => dayjs(entry.time).isAfter(start) && dayjs(entry.time).isBefore(end)).length;
    const diapers = data.diaper.filter((entry) => dayjs(entry.time).isAfter(start) && dayjs(entry.time).isBefore(end)).length;
    const pumping = data.pump.filter((entry) => dayjs(entry.start).isAfter(start) && dayjs(entry.start).isBefore(end)).length;
    const medicines = data.medicine.filter((entry) => dayjs(entry.time).isAfter(start) && dayjs(entry.time).isBefore(end)).length;
    const latestGrowth = [...data.growth].sort((a, b) => b.date.localeCompare(a.date))[0];

    return { sleepToday, feeds, diapers, pumping, medicines, latestGrowth };
  }, [data, start, end]);

  const timeline = useMemo<TimelineRow[]>(() => {
    const rows: TimelineRow[] = [
      ...data.sleep.map((entry) => ({
        id: `sleep-${entry.id}`,
        time: entry.start,
        title: "Sleep",
        detail: `${dayjs(entry.start).format("HH:mm")} - ${dayjs(entry.end).format("HH:mm")} (${formatDuration(entry.start, entry.end)})`,
        tone: "sleep",
        icon: <Moon size={18} />,
      })),
      ...data.feeding.map((entry) => ({
        id: `feeding-${entry.id}`,
        time: entry.time,
        title: entry.kind === "nursing" ? `Feeding (${entry.side})` : "Feeding (Bottle)",
        detail: entry.kind === "nursing" ? `Nursing - ${entry.durationMin ?? 0} min` : `${entry.source} - ${entry.volumeMl ?? 0} ml`,
        tone: "feed",
        icon: <Milk size={18} />,
      })),
      ...data.diaper.map((entry) => ({
        id: `diaper-${entry.id}`,
        time: entry.time,
        title: "Diaper",
        detail: `${entry.type}${entry.cream ? ` - Diaper cream (${entry.cream})` : ""}`,
        tone: "diaper",
        icon: <Baby size={18} />,
      })),
      ...data.pump.map((entry) => ({
        id: `pump-${entry.id}`,
        time: entry.start,
        title: "Pumping",
        detail: `${entry.side} ${formatDuration(entry.start, entry.finish)}${entry.volumeMl ? ` / ${entry.volumeMl} ml` : ""}`,
        tone: "pump",
        icon: <BriefcaseMedical size={18} />,
      })),
      ...data.medicine.map((entry) => ({
        id: `medicine-${entry.id}`,
        time: entry.time,
        title: "Medicine",
        detail: entry.doses.map((dose) => `${dose.name} - ${dose.amount} ${dose.unit}`).join(", "),
        tone: "med",
        icon: <Pill size={18} />,
      })),
    ];
    return rows.sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf()).slice(0, 8);
  }, [data]);

  const growthChart = useMemo(
    () =>
      [...data.growth]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => ({ date: dayjs(entry.date).format("MMM D"), weight: entry.weightKg ?? 0 })),
    [data.growth],
  );

  return (
    <AppShell title="Good morning, Mom!" subtitle="Here is Emma's summary for today.">
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

        <section className="panel">
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
            <div className="babyMetric" style={metricStyles.med}>
              <div className="babyMetricIcon"><Pill size={24} /></div>
              <strong>{summary.medicines}</strong>
              <span>Medicine</span>
            </div>
          </div>
        </section>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <section className="panel">
              <Row justify="space-between" align="middle" style={{ marginBottom: 10 }}>
                <Typography.Title level={4} style={{ margin: 0 }}>Today's Timeline</Typography.Title>
                <Button type="link">See all</Button>
              </Row>
              <div className="timelineList">
                {timeline.map((entry) => (
                  <div className="timelineRow" key={entry.id}>
                    <div className="timelineTime">{dayjs(entry.time).format("HH:mm")}</div>
                    <div className="timelineIcon" style={metricStyles[entry.tone]}>{entry.icon}</div>
                    <div className="timelineCard">
                      <strong>{entry.title}</strong>
                      <span>{entry.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </Col>
          <Col xs={24} xl={10}>
            <section className="panel">
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
            <section className="panel">
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
    </AppShell>
  );
}
