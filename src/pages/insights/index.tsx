import { useMemo, useState } from "react";
import { Typography } from "antd";
import dayjs from "dayjs";
import { Baby, Milk, Moon, Sunrise } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AppShell from "@/components/AppShell";
import { useData } from "@/context/DataContext";
import { durationMinutes, formatDuration } from "@/lib/format";

const TREND_SERIES = {
  sleep: { label: "Sleep", color: "#9d6ee8", unit: "h" },
  feedings: { label: "Feedings", color: "#ff5f93", unit: "" },
  diapers: { label: "Diapers", color: "#38bc94", unit: "" },
} as const;

type TrendKey = keyof typeof TREND_SERIES;

function groupCountByDay(entries: string[]) {
  return entries.reduce<Record<string, number>>((acc, iso) => {
    const key = dayjs(iso).format("YYYY-MM-DD");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function medianDayCount(counts: Record<string, number>) {
  const entries = Object.entries(counts);
  const value = median(entries.map(([, count]) => count));
  return value === null ? null : { value, days: entries.length };
}

function formatMedianCount(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function recentDays() {
  const today = dayjs().startOf("day");
  return Array.from({ length: 7 }, (_, i) => today.subtract(6 - i, "day"));
}

export default function InsightsPage() {
  const { data } = useData();
  const [visibleTrends, setVisibleTrends] = useState<Record<TrendKey, boolean>>({
    sleep: true,
    feedings: true,
    diapers: true,
  });

  const medianSleep = useMemo(() => {
    const sessions = data.sleep
      .filter((entry) => entry.end)
      .map((entry) => durationMinutes(entry.start, entry.end!));
    const value = median(sessions);
    return value === null ? null : { minutes: Math.round(value), count: sessions.length };
  }, [data.sleep]);

  const careTrend = useMemo(() => {
    const feedingCounts = groupCountByDay(data.feeding.map((entry) => entry.time));
    const diaperCounts = groupCountByDay(data.diaper.map((entry) => entry.time));

    return recentDays().map((day) => {
      const dayStart = day;
      const dayEnd = day.add(1, "day");
      const key = day.format("YYYY-MM-DD");
      const minutes = data.sleep.reduce((total, entry) => {
        if (!entry.end) return total;
        const start = dayjs(entry.start);
        const end = dayjs(entry.end);
        const overlapStart = start.isAfter(dayStart) ? start : dayStart;
        const overlapEnd = end.isBefore(dayEnd) ? end : dayEnd;
        const minutesInDay = overlapEnd.diff(overlapStart, "minute");
        return total + Math.max(0, minutesInDay);
      }, 0);
      return {
        date: day.format("MMM D"),
        shortDate: day.format("D"),
        sleep: Number((minutes / 60).toFixed(1)),
        feedings: feedingCounts[key] ?? 0,
        diapers: diaperCounts[key] ?? 0,
      };
    });
  }, [data.diaper, data.feeding, data.sleep]);

  const overnightMedian = useMemo(() => {
    const sessions = data.sleep
      .filter((entry) => entry.end)
      .filter((entry) => {
        const startHour = dayjs(entry.start).hour();
        const endHour = dayjs(entry.end!).hour();
        return startHour >= 18 || startHour < 8 || endHour < 8;
      })
      .map((entry) => durationMinutes(entry.start, entry.end!));
    const value = median(sessions);
    return value === null ? null : { minutes: Math.round(value), count: sessions.length };
  }, [data.sleep]);

  const medianFeedings = medianDayCount(groupCountByDay(data.feeding.map((entry) => entry.time)));
  const medianDiapers = medianDayCount(groupCountByDay(data.diaper.map((entry) => entry.time)));
  const hasVisibleTrend = Object.values(visibleTrends).some(Boolean);

  return (
    <AppShell title="Insights" subtitle="Care patterns">
      <div className="insightsPage">
        <section className="insightPanel sleepTrendPanel">
          <div className="sleepTrendHeader">
            <Typography.Title level={4}>Care Trend</Typography.Title>
            <span>(Last 7 days)</span>
          </div>
          <div className="trendChipRow" aria-label="Care trend series">
            {(Object.keys(TREND_SERIES) as TrendKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={visibleTrends[key] ? "trendChip active" : "trendChip"}
                style={{ "--trend-color": TREND_SERIES[key].color } as React.CSSProperties}
                aria-pressed={visibleTrends[key]}
                onClick={() => setVisibleTrends((current) => ({ ...current, [key]: !current[key] }))}
              >
                {TREND_SERIES[key].label}
              </button>
            ))}
          </div>
          <div className="sleepTrendChart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={careTrend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  {(Object.keys(TREND_SERIES) as TrendKey[]).map((key) => (
                    <linearGradient key={key} id={`${key}TrendFill`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TREND_SERIES[key].color} stopOpacity={0.24} />
                      <stop offset="100%" stopColor={TREND_SERIES[key].color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis dataKey="shortDate" tickLine={false} axisLine={false} stroke="#9aa0aa" fontSize={12} />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  stroke="#9aa0aa"
                  fontSize={12}
                  width={36}
                  domain={[0, "dataMax + 2"]}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const key = String(name) as TrendKey;
                    const meta = TREND_SERIES[key];
                    return [`${value}${meta.unit}`, meta.label];
                  }}
                  labelFormatter={(label) => label}
                />
                {hasVisibleTrend ? (
                  (Object.keys(TREND_SERIES) as TrendKey[]).map((key) =>
                    visibleTrends[key] ? (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={TREND_SERIES[key].color}
                        strokeWidth={2.5}
                        fill={`url(#${key}TrendFill)`}
                        dot={{ r: 3, stroke: TREND_SERIES[key].color, strokeWidth: 2, fill: "#ffffff" }}
                        activeDot={{ r: 5 }}
                      />
                    ) : null,
                  )
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {(medianSleep || medianFeedings || medianDiapers || overnightMedian) ? (
          <section className="insightPanel insightSummaryPanel">
            <Typography.Title level={4}>Insights</Typography.Title>
            <div className="insightCardGrid">
              {medianSleep ? (
                <div className="insightMiniCard" style={{ "--metric-bg": "#f8ecff", "--metric-color": "#9d6ee8" } as React.CSSProperties}>
                  <span className="insightMiniIcon"><Moon size={22} /></span>
                  <small>Median Sleep</small>
                  <strong>{formatDuration(medianSleep.minutes)}</strong>
                  <em>{medianSleep.count} sessions</em>
                </div>
              ) : null}
              {overnightMedian ? (
                <div className="insightMiniCard" style={{ "--metric-bg": "#eef0ff", "--metric-color": "#6470d1" } as React.CSSProperties}>
                  <span className="insightMiniIcon"><Sunrise size={22} /></span>
                  <small>Median Overnight Sleep</small>
                  <strong>{formatDuration(overnightMedian.minutes)}</strong>
                  <em>{overnightMedian.count} sessions - 6pm-8am</em>
                </div>
              ) : null}
              {medianFeedings ? (
                <div className="insightMiniCard" style={{ "--metric-bg": "#fff0f5", "--metric-color": "#ff5f93" } as React.CSSProperties}>
                  <span className="insightMiniIcon"><Milk size={22} /></span>
                  <small>Median Feedings</small>
                  <strong>{formatMedianCount(medianFeedings.value)} times/day</strong>
                  <em>{medianFeedings.days} days</em>
                </div>
              ) : null}
              {medianDiapers ? (
                <div className="insightMiniCard" style={{ "--metric-bg": "#eefdf8", "--metric-color": "#38bc94" } as React.CSSProperties}>
                  <span className="insightMiniIcon"><Baby size={22} /></span>
                  <small>Median Diapers</small>
                  <strong>{formatMedianCount(medianDiapers.value)} times/day</strong>
                  <em>{medianDiapers.days} days</em>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
