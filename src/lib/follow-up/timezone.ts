/**
 * Operator timezone helpers for follow-up due dates.
 * Authority: America/Chicago (JS Solutions ops calendar).
 */

import { FOLLOW_UP_OPERATOR_TIMEZONE } from "./constants";

function partsInOperatorTz(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: FOLLOW_UP_OPERATOR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return { year, month, day };
}

/** Calendar YYYY-MM-DD in operator timezone. */
export function operatorCalendarDateKey(date: Date = new Date()): string {
  const { year, month, day } = partsInOperatorTz(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Parse an operator-selected calendar date (YYYY-MM-DD) to a Date at noon
 * America/Chicago for that civil day (stable across DST for storage).
 */
export function parseOperatorFollowUpDate(
  yyyyMmDd: string,
): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  // Store as UTC noon offset approximation: use Date with explicit Chicago noon
  // via temporal-safe construction: local noon string interpreted in TZ.
  const probe = new Date(`${yyyyMmDd}T12:00:00`);
  if (Number.isNaN(probe.getTime())) {
    return null;
  }
  // Adjust so the calendar key in Chicago matches the intended day.
  const key = operatorCalendarDateKey(probe);
  if (key === yyyyMmDd) {
    return probe;
  }
  // Fallback: iterate hours to land on the intended Chicago day at ~noon.
  for (let hour = 6; hour <= 18; hour += 1) {
    const candidate = new Date(
      Date.UTC(year, month - 1, day, hour + 5, 0, 0),
    );
    if (operatorCalendarDateKey(candidate) === yyyyMmDd) {
      return candidate;
    }
  }
  return probe;
}

export function classifyFollowUpDueState(
  followUpAt: Date | string | null | undefined,
  now: Date = new Date(),
): "OVERDUE" | "DUE_TODAY" | "UPCOMING" | "NONE" {
  if (!followUpAt) {
    return "NONE";
  }
  const due =
    typeof followUpAt === "string" ? new Date(followUpAt) : followUpAt;
  if (Number.isNaN(due.getTime())) {
    return "NONE";
  }
  const dueKey = operatorCalendarDateKey(due);
  const todayKey = operatorCalendarDateKey(now);
  if (dueKey < todayKey) {
    return "OVERDUE";
  }
  if (dueKey === todayKey) {
    return "DUE_TODAY";
  }
  return "UPCOMING";
}

export function daysBetweenCalendar(
  from: Date,
  to: Date = new Date(),
): number {
  const a = operatorCalendarDateKey(from);
  const b = operatorCalendarDateKey(to);
  const aMs = Date.parse(`${a}T12:00:00Z`);
  const bMs = Date.parse(`${b}T12:00:00Z`);
  return Math.floor((bMs - aMs) / (24 * 60 * 60 * 1000));
}
