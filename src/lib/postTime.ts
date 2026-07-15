const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

function parseBeijingTime(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(trimmed);
  if (!match) return null;
  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
  const utcMilliseconds = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ) - BEIJING_OFFSET_MS;
  return new Date(utcMilliseconds);
}

export function getSystemTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function getTimeZoneOffsetLabel(timeZone: string, date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    }).formatToParts(date);
    const offset = parts.find((part) => part.type === "timeZoneName")?.value;
    if (!offset || offset === "GMT") return "UTC+00:00";
    return offset.replace("GMT", "UTC");
  } catch {
    return "UTC";
  }
}

export function getPostTimeOffsetLabel(value: string, timeZone: string): string {
  const date = parseBeijingTime(value);
  return getTimeZoneOffsetLabel(timeZone, date ?? new Date());
}

export function formatPostTimeInZone(value: string, timeZone: string): string {
  const date = parseBeijingTime(value);
  if (!date) return value;

  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}年${Number(get("month"))}月${Number(get("day"))}日 ${get("hour")}:${get("minute")}:${get("second")}`;
}
