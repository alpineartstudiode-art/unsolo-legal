export const DATE_MODES = Object.freeze(["exact", "month", "flexible"]);

export function emptyDateState(mode = "flexible") {
  if (!DATE_MODES.includes(mode)) throw new Error("invalid_date_mode");
  return Object.freeze({ date_mode: mode, date_from: null, date_to: null, month_start: null });
}

export function switchDateMode(_current, mode) {
  return emptyDateState(mode);
}

function parseDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day ? { year, month, day, ordinal: Date.UTC(year, month - 1, day) } : null;
}

function formatDate(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function berlinToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (type) => Number(parts.find((part) => part.type === type)?.value);
  return formatDate(get("year"), get("month"), get("day"));
}

export function addCalendarMonths(dateOnly, count) {
  const parsed = parseDateOnly(dateOnly);
  if (!parsed || !Number.isInteger(count)) throw new Error("invalid_date");
  const targetMonth = parsed.month - 1 + count;
  const year = parsed.year + Math.floor(targetMonth / 12);
  const monthIndex = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return formatDate(year, monthIndex + 1, Math.min(parsed.day, lastDay));
}

export function validateDateState(value, { today = berlinToday() } = {}) {
  if (!value || !DATE_MODES.includes(value.date_mode) || !parseDateOnly(today)) {
    return { ok: false, error: "invalid_date_mode" };
  }
  const from = value.date_from ?? null;
  const to = value.date_to ?? null;
  const month = value.month_start ?? null;
  const horizon = addCalendarMonths(today, 24);
  if (value.date_mode === "flexible") {
    return from === null && to === null && month === null
      ? { ok: true, fields: emptyDateState("flexible") }
      : { ok: false, error: "invalid_dates" };
  }
  if (value.date_mode === "exact") {
    const start = parseDateOnly(from);
    const end = parseDateOnly(to);
    if (!start || !end || month !== null || start.ordinal > end.ordinal ||
        end.ordinal < parseDateOnly(today).ordinal ||
        start.ordinal > parseDateOnly(horizon).ordinal || end.ordinal > parseDateOnly(horizon).ordinal) {
      return { ok: false, error: "invalid_dates" };
    }
    return { ok: true, fields: Object.freeze({ date_mode: "exact", date_from: from,
      date_to: to, month_start: null }) };
  }
  const parsedMonth = parseDateOnly(month);
  const currentMonth = `${today.slice(0, 7)}-01`;
  const horizonMonth = `${horizon.slice(0, 7)}-01`;
  if (from !== null || to !== null || !parsedMonth || parsedMonth.day !== 1 ||
      parsedMonth.ordinal < parseDateOnly(currentMonth).ordinal ||
      parsedMonth.ordinal > parseDateOnly(horizonMonth).ordinal) {
    return { ok: false, error: "invalid_dates" };
  }
  return { ok: true, fields: Object.freeze({ date_mode: "month", date_from: null,
    date_to: null, month_start: month }) };
}
