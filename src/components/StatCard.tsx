import { ReactNode } from "react";
import { Statistic } from "antd";

export default function StatCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <section className="statCard">
      <div className="statIcon">{icon}</div>
      <Statistic title={label} value={value} suffix={suffix} valueStyle={{ fontSize: 26, fontWeight: 700 }} />
    </section>
  );
}
