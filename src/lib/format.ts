import dayjs from "dayjs";

export function formatDateTime(iso: string): string {
  return dayjs(iso).format("DD/MM/YYYY HH:mm");
}

export function formatTime(iso: string): string {
  return dayjs(iso).format("HH:mm");
}

export function formatDate(iso: string): string {
  return dayjs(iso).format("DD/MM/YYYY");
}

export function diffMinutes(startIso: string, endIso: string): number {
  return Math.max(0, dayjs(endIso).diff(dayjs(startIso), "minute"));
}

export function durationMinutes(startIso: string, endIso: string): number {
  return diffMinutes(startIso, endIso);
}

export function formatDuration(startOrMinutes: string | number, endIso?: string): string {
  const min = typeof startOrMinutes === "number" ? startOrMinutes : diffMinutes(startOrMinutes, endIso ?? startOrMinutes);
  if (!Number.isFinite(min) || min < 0) return "-";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function todayRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  const now = dayjs();
  return [now.startOf("day"), now.endOf("day")];
}

export function newId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
