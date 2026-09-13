import { describe, expect, test } from "vitest";

import {
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
} from "./calendar";

describe("iso parsing and formatting", () => {
  test("round-trips valid dates", () => {
    expect(formatIsoDate(2026, 2, 5)).toBe("2026-02-05");
    expect(parseIsoDate("2026-02-05")).toEqual({
      year: 2026,
      month: 2,
      day: 5,
    });
  });

  test("rejects malformed and non-existent dates", () => {
    expect(parseIsoDate("2026-2-5")).toBeUndefined();
    expect(parseIsoDate("2026-02-30")).toBeUndefined();
    expect(parseIsoDate("2026-13-01")).toBeUndefined();
    expect(parseIsoDate("hello")).toBeUndefined();
    // Leap-day: valid in 2024, not in 2026.
    expect(parseIsoDate("2024-02-29")).toBeDefined();
    expect(parseIsoDate("2026-02-29")).toBeUndefined();
  });

  test("daysInMonth handles leap years", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  test("addMonths wraps years in both directions", () => {
    expect(addMonths(2026, 11, 3)).toEqual({ year: 2027, month: 2 });
    expect(addMonths(2026, 2, -3)).toEqual({ year: 2025, month: 11 });
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
});

describe("iso weeks", () => {
  test("follows the Thursday rule at year boundaries", () => {
    // 2026-01-01 is a Thursday — week 1 of 2026.
    expect(isoWeek(2026, 1, 1)).toEqual({ weekYear: 2026, week: 1 });
    // 2027-01-01 is a Friday — still week 53 of 2026.
    expect(isoWeek(2027, 1, 1)).toEqual({ weekYear: 2026, week: 53 });
    // 2024-12-30 (Monday) belongs to week 1 of 2025.
    expect(isoWeek(2024, 12, 30)).toEqual({ weekYear: 2025, week: 1 });
  });

  test("formats the type=week value", () => {
    expect(formatIsoWeek(2026, 5)).toBe("2026-W05");
    expect(formatIsoWeek(2026, 53)).toBe("2026-W53");
  });
});

describe("calendarMonth", () => {
  test("lays out a month with outside days completing the weeks", () => {
    // February 2026: Feb 1 is a Sunday; Monday-start grid leads with 6
    // January days and ends on March 1.
    const grid = calendarMonth(2026, 2);

    expect(grid.weeks.length).toBe(5);
    const first = grid.weeks[0].days;
    expect(first[0]).toMatchObject({ iso: "2026-01-26", outside: true });
    expect(first[6]).toMatchObject({ iso: "2026-02-01", outside: false });
    const last = grid.weeks[4].days;
    expect(last[6]).toMatchObject({ iso: "2026-03-01", outside: true });

    // Every row is Monday-first.
    for (const week of grid.weeks) {
      expect(week.days[0].weekday).toBe(1);
      expect(week.days.length).toBe(7);
    }
  });

  test("carries ISO week identities per row", () => {
    const grid = calendarMonth(2026, 1);
    // January 2026 starts in week 1 (Jan 1 is a Thursday).
    expect(grid.weeks[0]).toMatchObject({ weekYear: 2026, week: 1 });

    const december = calendarMonth(2026, 12);
    const lastWeek = december.weeks.at(-1)!;
    expect(lastWeek).toMatchObject({ weekYear: 2026, week: 53 });
  });

  test("fixedWeeks always yields six rows", () => {
    expect(calendarMonth(2026, 2, { fixedWeeks: true }).weeks.length).toBe(6);
    // A 31-day month starting late needs 6 rows naturally.
    expect(calendarMonth(2026, 8).weeks.length).toBe(6);
  });

  test("a Sunday-start grid rotates the rows", () => {
    const grid = calendarMonth(2026, 2, { firstDayOfWeek: 7 });
    // Feb 1 is a Sunday — no leading outside days at all.
    expect(grid.weeks[0].days[0]).toMatchObject({
      iso: "2026-02-01",
      weekday: 7,
      outside: false,
    });
  });

  test("flags today and disabled days", () => {
    const grid = calendarMonth(2026, 2, {
      today: "2026-02-05",
      min: "2026-02-03",
      max: "2026-02-20",
      isDateDisabled: (iso) => iso === "2026-02-10",
    });

    const days = grid.weeks.flatMap((week) => week.days);
    const by = (iso: string) => days.find((day) => day.iso === iso)!;

    expect(by("2026-02-05").today).toBe(true);
    expect(by("2026-02-06").today).toBe(false);
    expect(by("2026-02-02").disabled).toBe(true); // below min
    expect(by("2026-02-03").disabled).toBe(false); // min is inclusive
    expect(by("2026-02-20").disabled).toBe(false); // max is inclusive
    expect(by("2026-02-21").disabled).toBe(true); // above max
    expect(by("2026-02-10").disabled).toBe(true); // hook
  });
});

describe("locale names", () => {
  test("month names follow the locale", () => {
    expect(monthNames("en")[0]).toBe("January");
    expect(monthNames("da")[0]).toBe("januar");
    expect(monthNames("en", "short")[11]).toBe("Dec");
  });

  test("weekday names rotate to the requested start", () => {
    expect(weekdayNames("en", "long")).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    expect(weekdayNames("en", "long", 7)[0]).toBe("Sunday");
    expect(weekdayNames("da", "long")[0]).toBe("mandag");
  });

  test("first day of week follows regional convention", () => {
    expect(firstDayOfWeek("da")).toBe(1);
    expect(firstDayOfWeek("en-US")).toBe(7);
  });
});
