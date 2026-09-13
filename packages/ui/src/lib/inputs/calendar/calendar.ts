/**
 * The headless calendar engine the pickers are built on — pure date math
 * plus Intl-backed names, no DOM and no state. Values are the same ISO
 * strings the native date inputs submit ("YYYY-MM-DD", "YYYY-Www"), so
 * anything built on this engine keeps the library's server contract.
 *
 * Months are 1-based everywhere in this API (January = 1, matching the ISO
 * strings); JavaScript's 0-based Date months stay an internal detail.
 * Weekdays are ISO-numbered: Monday = 1 … Sunday = 7.
 *
 * Supported year range: 0100–9999. Below it, Date.UTC's two-digit-year
 * quirk remaps years onto 19xx; above it, five-digit ISO strings break the
 * lexicographic min/max comparisons. `parseIsoDate` rejects values outside
 * the range (its round-trip check), so picker input never leaves it —
 * direct engine calls must respect it themselves.
 */

/** One cell of a month grid. */
interface CalendarDay {
  /** The day's value in the library's contract format, "YYYY-MM-DD". */
  iso: string;
  year: number;
  /** 1-based month the day actually belongs to (leading/trailing cells
   * belong to the neighbouring months). */
  month: number;
  /** Day of month, 1-based. */
  day: number;
  /** ISO weekday: Monday = 1 … Sunday = 7. */
  weekday: number;
  /** True for leading/trailing cells filling the grid from the
   * neighbouring months. */
  outside: boolean;
  /** True when the day equals the `today` option. */
  today: boolean;
  /** True when the day falls outside min/max or `isDateDisabled` says so. */
  disabled: boolean;
}

/** One row of a month grid, with its ISO week identity. */
interface CalendarWeek {
  /** ISO-8601 week number (1–53) — the Danish/`type="week"` convention. */
  week: number;
  /** The week-numbering year — differs from the calendar year around new
   * year (2027-01-01 belongs to week 53 of 2026). */
  weekYear: number;
  /** Exactly 7 days, ordered by the grid's `firstDayOfWeek`. */
  days: CalendarDay[];
}

/** A month laid out as a grid of full weeks. */
interface CalendarMonth {
  year: number;
  /** 1-based. */
  month: number;
  weeks: CalendarWeek[];
}

interface CalendarMonthOptions {
  /** ISO weekday the grid's rows start on: Monday = 1 … Sunday = 7.
   * Defaults to 1 (Monday) — pass {@link firstDayOfWeek} of a locale to
   * follow regional convention. */
  firstDayOfWeek?: number;
  /** Always produce 6 rows (padding with trailing days) so a picker keeps
   * a stable height across months. Defaults to false: 4–6 natural rows. */
  fixedWeeks?: boolean;
  /** ISO date to flag as {@link CalendarDay.today} — passed in rather than
   * read from the clock, keeping the engine pure and testable. */
  today?: string;
  /** Inclusive ISO lower bound; earlier days are marked disabled. */
  min?: string;
  /** Inclusive ISO upper bound; later days are marked disabled. */
  max?: string;
  /** Marks additional days disabled (booked dates, weekends, …). Runs
   * after min/max; return true to disable. */
  isDateDisabled?: (iso: string) => boolean;
}

const DAY_MS = 86_400_000;

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

/** Formats calendar fields as the contract's "YYYY-MM-DD" (month 1-based). */
function formatIsoDate(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

/**
 * Parses a strict "YYYY-MM-DD" string into calendar fields, or undefined
 * for anything malformed or non-existent (2026-02-30, 2026-13-01, …).
 */
function parseIsoDate(
  value: string,
): { year: number; month: number; day: number } | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Round-trip through UTC: JS dates silently roll invalid days over into
  // the next month, which is exactly the forgery this rejects.
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return { year, month, day };
}

/** Days in a month (1-based month), leap years included. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Steps a 1-based year/month by `delta` months (negative fine). */
function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(index / 12),
    month: (((index % 12) + 12) % 12) + 1,
  };
}

/** ISO weekday (Monday = 1 … Sunday = 7) of a UTC date. */
function isoWeekday(date: Date): number {
  return ((date.getUTCDay() + 6) % 7) + 1;
}

/**
 * ISO-8601 week identity of a date — the week-numbering `weekYear` and the
 * 1–53 `week`. This is the convention Danish calendars and the native
 * `type="week"` input use (week 1 = the week containing the year's first
 * Thursday).
 */
function isoWeek(
  year: number,
  month: number,
  day: number,
): { weekYear: number; week: number } {
  // The Thursday rule: a week belongs to the year its Thursday falls in.
  const thursday = new Date(Date.UTC(year, month - 1, day));
  thursday.setUTCDate(thursday.getUTCDate() - isoWeekday(thursday) + 4);

  const weekYear = thursday.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(weekYear, 0, 4));
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() - isoWeekday(firstThursday) + 4,
  );

  return {
    weekYear,
    week:
      1 +
      Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * DAY_MS)),
  };
}

/** Formats an ISO week identity as the `type="week"` value, "YYYY-Www". */
function formatIsoWeek(weekYear: number, week: number): string {
  return `${pad(weekYear, 4)}-W${pad(week, 2)}`;
}

/**
 * Lays a month out as a grid of full weeks — the data structure a month
 * view renders directly. Leading/trailing cells come from the neighbouring
 * months (`outside: true`); every row carries its ISO week identity.
 *
 * ISO date strings compare lexicographically, so min/max are plain string
 * comparisons — no Date construction in the hot path.
 */
function calendarMonth(
  year: number,
  month: number,
  options: CalendarMonthOptions = {},
): CalendarMonth {
  const {
    firstDayOfWeek = 1,
    fixedWeeks = false,
    today,
    min,
    max,
    isDateDisabled,
  } = options;

  const first = new Date(Date.UTC(year, month - 1, 1));
  const lead = (isoWeekday(first) - firstDayOfWeek + 7) % 7;
  const rows = fixedWeeks
    ? 6
    : Math.ceil((lead + daysInMonth(year, month)) / 7);

  const cursor = new Date(first);
  cursor.setUTCDate(1 - lead);

  const weeks: CalendarWeek[] = [];
  for (let row = 0; row < rows; row++) {
    const days: CalendarDay[] = [];
    for (let column = 0; column < 7; column++) {
      const dayYear = cursor.getUTCFullYear();
      const dayMonth = cursor.getUTCMonth() + 1;
      const dayOfMonth = cursor.getUTCDate();
      const iso = formatIsoDate(dayYear, dayMonth, dayOfMonth);

      days.push({
        iso,
        year: dayYear,
        month: dayMonth,
        day: dayOfMonth,
        weekday: isoWeekday(cursor),
        outside: dayMonth !== month || dayYear !== year,
        today: iso === today,
        disabled:
          (min !== undefined && iso < min) ||
          (max !== undefined && iso > max) ||
          (isDateDisabled?.(iso) ?? false),
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // A row's ISO week identity comes from its Thursday — well-defined for
    // any firstDayOfWeek, where "the row's Monday" would be ambiguous.
    const anchor = days.find((candidate) => candidate.weekday === 4)!;
    weeks.push({ ...isoWeek(anchor.year, anchor.month, anchor.day), days });
  }

  return { year, month, weeks };
}

/**
 * The locale's first day of week as an ISO weekday (Monday = 1 … Sunday =
 * 7) — Denmark gives 1, en-US gives 7. Falls back to Monday where the
 * Intl week-info API is unavailable. Pass no locale for the runtime's
 * default.
 */
function firstDayOfWeek(locale?: string): number {
  try {
    const resolved = new Intl.Locale(
      locale ?? new Intl.DateTimeFormat().resolvedOptions().locale,
    );
    // The spec moved from a `weekInfo` property to a `getWeekInfo()` method
    // — engines ship one or the other.
    const info =
      (
        resolved as { getWeekInfo?: () => { firstDay: number } }
      ).getWeekInfo?.() ??
      (resolved as { weekInfo?: { firstDay: number } }).weekInfo;
    return info?.firstDay ?? 1;
  } catch {
    return 1;
  }
}

/**
 * The locale's twelve month names, January first. Pass no locale for the
 * runtime's default.
 */
function monthNames(
  locale?: string,
  style: "long" | "short" | "narrow" = "long",
): string[] {
  const format = new Intl.DateTimeFormat(locale, {
    month: style,
    timeZone: "UTC",
  });
  return Array.from({ length: 12 }, (_, index) =>
    format.format(new Date(Date.UTC(2024, index, 1))),
  );
}

/**
 * The locale's weekday names in grid order — rotated so index 0 matches
 * `firstDayOfWeek` (default Monday). Pass no locale for the runtime's
 * default.
 */
function weekdayNames(
  locale?: string,
  style: "long" | "short" | "narrow" = "short",
  weekStart: number = 1,
): string[] {
  const format = new Intl.DateTimeFormat(locale, {
    weekday: style,
    timeZone: "UTC",
  });
  // 2024-01-01 is a Monday; offset from it by the requested start.
  return Array.from({ length: 7 }, (_, index) =>
    format.format(
      new Date(Date.UTC(2024, 0, 1 + ((weekStart - 1 + index) % 7))),
    ),
  );
}

export {
  addMonths,
  calendarMonth,
  daysInMonth,
  firstDayOfWeek,
  formatIsoDate,
  formatIsoWeek,
  isoWeek,
  monthNames,
  parseIsoDate,
  weekdayNames,
};
export type { CalendarDay, CalendarMonth, CalendarMonthOptions, CalendarWeek };
