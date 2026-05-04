import { useEffect, useMemo, useRef, useState } from "react";
import { Typography } from "antd";
import dayjs from "dayjs";
import { Bath, Gamepad2, Moon, Pill, Trees } from "lucide-react";
import { BottleIcon, DiaperIcon, PumpBottleIcon } from "@/components/icons";
import { timelineMetricStyles } from "@/components/Timeline";
import { durationMinutes, formatDuration } from "@/lib/format";
import type { BabyData } from "@/lib/types";

interface DailySummaryProps {
  data: BabyData;
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  title: string;
  label: string;
  className?: string;
}

export default function DailySummary({ data, start, end, title, label, className = "" }: DailySummaryProps) {
  const summaryGridRef = useRef<HTMLDivElement | null>(null);
  const [summaryScrollState, setSummaryScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

  const summary = useMemo(() => {
    const inRange = (iso: string) => {
      const t = dayjs(iso);
      return t.isAfter(start) && t.isBefore(end);
    };
    const sleep = data.sleep
      .filter((entry) => inRange(entry.end ?? dayjs().toISOString()))
      .reduce((total, entry) => total + durationMinutes(entry.start, entry.end ?? dayjs().toISOString()), 0);
    const feedings = data.feeding.filter((entry) => {
      if (entry.kind === "nursing") return inRange(entry.end ?? entry.time);
      return inRange(entry.time);
    }).length;
    const diapers = data.diaper.filter((entry) => inRange(entry.time)).length;
    const pumping = data.pump.filter((entry) => inRange(entry.finish)).length;
    const medicines = data.medicine.filter((entry) => inRange(entry.time)).length;
    const baths = data.bath.filter((entry) => inRange(entry.time)).length;
    const playtime = data.playtime.filter((entry) => inRange(entry.time)).length;
    const outings = data.outing.filter((entry) => inRange(entry.end ?? entry.start ?? entry.time ?? dayjs().toISOString())).length;

    return { sleep, feedings, diapers, pumping, medicines, baths, playtime, outings };
  }, [data, end, start]);

  const updateSummaryScrollState = () => {
    const el = summaryGridRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const next = {
      canScrollLeft: el.scrollLeft > 2,
      canScrollRight: el.scrollLeft < maxScrollLeft - 2,
    };
    setSummaryScrollState((prev) =>
      prev.canScrollLeft === next.canScrollLeft && prev.canScrollRight === next.canScrollRight ? prev : next,
    );
  };

  useEffect(() => {
    updateSummaryScrollState();
    window.addEventListener("resize", updateSummaryScrollState);
    return () => window.removeEventListener("resize", updateSummaryScrollState);
  }, [summary]);

  return (
    <section className={`panel summaryPanel ${className}`.trim()}>
      <div className="mobileSectionHeader">
        <Typography.Title className="mobileSectionTitle" level={5}>{title}</Typography.Title>
        <span>{label}</span>
      </div>
      <div className="summaryScroller">
        <div className="summaryGrid" ref={summaryGridRef} onScroll={updateSummaryScrollState}>
          <div className="babyMetric" style={timelineMetricStyles.sleep}>
            <div className="babyMetricIcon"><Moon size={24} /></div>
            <strong>{formatDuration(summary.sleep)}</strong>
            <span>Sleep</span>
          </div>
          <div className="babyMetric" style={timelineMetricStyles.feed}>
            <div className="babyMetricIcon"><BottleIcon size={24} /></div>
            <strong>{summary.feedings}</strong>
            <span>Feedings</span>
          </div>
          <div className="babyMetric" style={timelineMetricStyles.diaper}>
            <div className="babyMetricIcon"><DiaperIcon size={24} /></div>
            <strong>{summary.diapers}</strong>
            <span>Diapers</span>
          </div>
          <div className="babyMetric" style={timelineMetricStyles.pump}>
            <div className="babyMetricIcon"><PumpBottleIcon size={24} /></div>
            <strong>{summary.pumping}</strong>
            <span>Pumping</span>
          </div>
          <div className="babyMetric" style={timelineMetricStyles.bath}>
            <div className="babyMetricIcon"><Bath size={24} /></div>
            <strong>{summary.baths}</strong>
            <span>Bath</span>
          </div>
          <div className="babyMetric" style={timelineMetricStyles.med}>
            <div className="babyMetricIcon"><Pill size={24} /></div>
            <strong>{summary.medicines}</strong>
            <span>Medicine</span>
          </div>
          <div className="babyMetric" style={timelineMetricStyles.play}>
            <div className="babyMetricIcon"><Gamepad2 size={24} /></div>
            <strong>{summary.playtime}</strong>
            <span>Playtime</span>
          </div>
          <div className="babyMetric" style={timelineMetricStyles.outing}>
            <div className="babyMetricIcon"><Trees size={24} /></div>
            <strong>{summary.outings}</strong>
            <span>Outing</span>
          </div>
        </div>
        {summaryScrollState.canScrollLeft ? (
          <div className="summaryScrollHint left" aria-hidden="true">{"<"}</div>
        ) : null}
        {summaryScrollState.canScrollRight ? (
          <div className="summaryScrollHint right" aria-hidden="true">{">"}</div>
        ) : null}
      </div>
    </section>
  );
}
