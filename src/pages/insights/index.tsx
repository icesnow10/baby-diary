import { useMemo } from "react";
import Link from "next/link";
import { Button, Typography } from "antd";
import dayjs from "dayjs";
import { BarChart3, Baby, Moon, Milk, Package } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import AppShell from "@/components/AppShell";
import { useData } from "@/context/DataContext";
import { durationMinutes, formatDuration } from "@/lib/format";

function groupCountByDay(entries: string[]) {
  return entries.reduce<Record<string, number>>((acc, iso) => {
    const key = dayjs(iso).format("YYYY-MM-DD");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function maxDay(counts: Record<string, number>) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
}

export default function InsightsPage() {
  const { data } = useData();

  const growth = useMemo(() => [...data.growth].sort((a, b) => a.date.localeCompare(b.date)), [data.growth]);
  const latestGrowth = growth[growth.length - 1];
  const previousGrowth = growth[growth.length - 2];

  const weightData = growth.filter((entry) => entry.weightKg).map((entry) => ({ value: entry.weightKg }));
  const heightData = growth.filter((entry) => entry.heightCm).map((entry) => ({ value: entry.heightCm }));
  const headData = growth.filter((entry) => entry.headCm).map((entry) => ({ value: entry.headCm }));

  const longestSleep = useMemo(
    () =>
      data.sleep
        .filter((entry) => entry.end)
        .map((entry) => ({ ...entry, minutes: durationMinutes(entry.start, entry.end!) }))
        .sort((a, b) => b.minutes - a.minutes)[0],
    [data.sleep],
  );

  const feedDay = maxDay(groupCountByDay(data.feeding.map((entry) => entry.time)));
  const diaperDay = maxDay(groupCountByDay(data.diaper.map((entry) => entry.time)));

  const updatedGrowthDate = latestGrowth?.date ? dayjs(latestGrowth.date).format("MMM D") : null;
  const updatedInventoryDate = data.diaperInventory.length ? dayjs().format("MMM D") : null;

  return (
    <AppShell title="Insights" subtitle="Growth, inventory, and care patterns">
      <div className="insightsPage">
        <div className="insightsTopGrid">
          <section className="insightPanel growthPanel">
            <div className="insightHeader">
              <div>
                <Typography.Title level={4}>Growth</Typography.Title>
                {updatedGrowthDate ? <Typography.Text>Last updated: {updatedGrowthDate}</Typography.Text> : null}
              </div>
              <span className="insightHeaderIcon growthTone"><BarChart3 size={22} /></span>
            </div>

            {latestGrowth ? (
              <div className="growthMetricGrid">
                {latestGrowth.weightKg ? (
                  <div className="growthMetric greenTone">
                    <span>Weight</span>
                    <strong>{latestGrowth.weightKg} kg</strong>
                    <Sparkline data={weightData} color="#61bf73" />
                  </div>
                ) : null}
                {latestGrowth.heightCm ? (
                  <div className="growthMetric blueTone">
                    <span>Height</span>
                    <strong>{latestGrowth.heightCm} cm</strong>
                    <Sparkline data={heightData} color="#5d9cec" />
                  </div>
                ) : null}
                {latestGrowth.headCm ? (
                  <div className="growthMetric violetTone">
                    <span>Head</span>
                    <strong>{latestGrowth.headCm} cm</strong>
                    <Sparkline data={headData} color="#a66bea" />
                  </div>
                ) : null}
              </div>
            ) : null}

            <Link href="/growth" className="insightAddButton">Add Growth</Link>
          </section>

          <section className="insightPanel inventoryPanel">
            <div className="insightHeader">
              <div>
                <Typography.Title level={4}>Diaper Inventory</Typography.Title>
                {updatedInventoryDate ? <Typography.Text>Updated: {updatedInventoryDate}</Typography.Text> : null}
              </div>
            </div>
            <div className="inventoryInsightList">
              {data.diaperInventory.map((item, index) => (
                <div className="inventoryInsightRow" key={item.size}>
                  <span className={`inventoryIcon inventoryTone${index % 4}`}><Package size={17} /></span>
                  <strong>{item.size}</strong>
                  <span className={item.count === 0 ? "emptyCount" : ""}>{item.count} pcs</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {(longestSleep || feedDay || diaperDay) ? (
          <section className="insightPanel insightSummaryPanel">
            <Typography.Title level={4}>Insights</Typography.Title>
            <div className="insightCardGrid">
              {longestSleep ? (
                <div className="insightMiniCard" style={{ "--metric-bg": "#f8ecff", "--metric-color": "#9d6ee8" } as React.CSSProperties}>
                  <span className="insightMiniIcon"><Moon size={22} /></span>
                  <small>Longest Sleep</small>
                  <strong>{formatDuration(longestSleep.minutes)}</strong>
                  <em>{dayjs(longestSleep.start).format("MMM D")}</em>
                </div>
              ) : null}
              {feedDay ? (
                <div className="insightMiniCard" style={{ "--metric-bg": "#fff0f5", "--metric-color": "#ff5f93" } as React.CSSProperties}>
                  <span className="insightMiniIcon"><Milk size={22} /></span>
                  <small>Most Feedings</small>
                  <strong>{feedDay[1]} times</strong>
                  <em>{dayjs(feedDay[0]).format("MMM D")}</em>
                </div>
              ) : null}
              {diaperDay ? (
                <div className="insightMiniCard" style={{ "--metric-bg": "#eefdf8", "--metric-color": "#38bc94" } as React.CSSProperties}>
                  <span className="insightMiniIcon"><Baby size={22} /></span>
                  <small>Most Diapers</small>
                  <strong>{diaperDay[1]} times</strong>
                  <em>{dayjs(diaperDay[0]).format("MMM D")}</em>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

function Sparkline({ data, color }: { data: { value?: number }[]; color: string }) {
  if (data.length < 2) return null;

  return (
    <div className="sparklineBox">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.08} strokeWidth={2} dot={{ r: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
