import { userEvent } from "vitest/browser";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import Fixture from "./date-picker.fixture.svelte";

const day = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);

describe("date picker", () => {
  test("initial active clamps into [min,max] so the grid keeps its tab stop", async () => {
    // Nothing selected and today far outside the window: the roving
    // fallback must clamp to min — a disabled cell cannot take focus, and
    // an out-of-bounds tab stop makes the whole grid keyboard-unreachable.
    await render(Fixture, { min: "2091-02-05", max: "2091-12-24" });

    expect(day("2091-02-05")?.tabIndex).toBe(0);
    expect(day("2091-02-05")?.disabled).toBe(false);
  });

  test("renders the value's month and selects on click", async () => {
    const onselect = vi.fn();
    const screen = await render(Fixture, {
      initial: "2026-02-05",
      onselect,
    });

    // Danish grid: Monday-first, February 2026 leads with January days.
    const grid = document.querySelector('[role="grid"]')!;
    expect(grid.getAttribute("aria-label")).toContain("2026");
    expect(day("2026-01-26")).not.toBeNull();
    expect(day("2026-02-05")?.getAttribute("aria-selected")).toBe("true");
    expect(day("2026-02-05")?.tabIndex).toBe(0);
    expect(day("2026-02-06")?.tabIndex).toBe(-1);

    day("2026-02-14")!.click();
    await expect
      .element(screen.getByTestId("value"))
      .toHaveTextContent("2026-02-14");
    expect(onselect).toHaveBeenCalledWith("2026-02-14");
    expect(day("2026-02-14")?.getAttribute("aria-selected")).toBe("true");
  });

  test("arrow keys rove; crossing the month flips the view", async () => {
    await render(Fixture, { initial: "2026-02-28" });

    day("2026-02-28")!.focus();
    await userEvent.keyboard("{ArrowRight}");

    // Feb 28 is the last day of 2026-02 — focus lands on March 1 in the
    // NEXT month's view.
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe(
        "2026-03-01",
      );
    });
    const grid = document.querySelector('[role="grid"]')!;
    expect(grid.getAttribute("aria-label")).toContain("marts");

    await userEvent.keyboard("{ArrowUp}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe(
        "2026-02-22",
      );
    });
  });

  test("keyboard selection updates the bound value", async () => {
    const screen = await render(Fixture, { initial: "2026-02-05" });

    day("2026-02-05")!.focus();
    await userEvent.keyboard("{ArrowDown}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe(
        "2026-02-12",
      );
    });
    await userEvent.keyboard("{Enter}");

    await expect
      .element(screen.getByTestId("value"))
      .toHaveTextContent("2026-02-12");
  });

  test("min/max disable days and block selection", async () => {
    const screen = await render(Fixture, {
      initial: "2026-02-10",
      min: "2026-02-05",
      max: "2026-02-20",
    });

    expect(day("2026-02-04")?.disabled).toBe(true);
    expect(day("2026-02-05")?.disabled).toBe(false);
    expect(day("2026-02-21")?.disabled).toBe(true);

    day("2026-02-21")!.click();
    await expect
      .element(screen.getByTestId("value"))
      .toHaveTextContent("2026-02-10");
  });

  test("header dropdowns jump the view in one pick", async () => {
    await render(Fixture, { initial: "2026-07-15" });

    // Back 3 years and 5 months: two picks, not 41 clicks.
    const year = document.querySelector<HTMLSelectElement>(
      'select[aria-label="Year"]',
    )!;
    year.value = "2023";
    year.dispatchEvent(new Event("change", { bubbles: true }));
    const month = document.querySelector<HTMLSelectElement>(
      'select[aria-label="Month"]',
    )!;
    month.value = "2";
    month.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() => {
      expect(day("2023-02-15")).not.toBeNull();
      expect(day("2023-02-15")?.tabIndex).toBe(0);
    });
    // Danish month names populate the dropdown.
    expect(month.options[1].textContent).toBe("februar");
  });

  test("navigation clamps to min/max", async () => {
    await render(Fixture, {
      initial: "2026-02-10",
      min: "2026-01-05",
      max: "2026-03-20",
    });

    // Roving left of min lands ON min, not past it.
    day("2026-02-10")!.focus();
    await userEvent.keyboard("{PageUp}{PageUp}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe(
        "2026-01-05",
      );
    });

    // At the min month the previous-month chevron is disabled.
    const previous = document.querySelector<HTMLButtonElement>(
      'button[title="Previous month"]',
    )!;
    expect(previous.disabled).toBe(true);

    // Month options outside the window are disabled (May is beyond max).
    const month = document.querySelector<HTMLSelectElement>(
      'select[aria-label="Month"]',
    )!;
    expect(month.options[4].disabled).toBe(true);
    expect(month.options[2].disabled).toBe(false);
  });

  test("malformed min/max degrade to the default year range, no crash", async () => {
    // Consumer typos happen ("2026-2-05", a bare year): bounds that fail
    // strict parsing must not take the whole component down.
    await render(Fixture, {
      initial: "2026-02-10",
      min: "garbage",
      max: "2026-13-99",
    });

    expect(day("2026-02-10")?.tabIndex).toBe(0);
    const year = document.querySelector<HTMLSelectElement>(
      'select[aria-label="Year"]',
    )!;
    expect(year.options.length).toBeGreaterThan(1);
  });

  test("roving right of max lands ON max; the next chevron disables", async () => {
    await render(Fixture, {
      initial: "2026-03-18",
      min: "2026-01-05",
      max: "2026-03-20",
    });

    day("2026-03-18")!.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe(
        "2026-03-20",
      );
    });

    const next = document.querySelector<HTMLButtonElement>(
      'button[title="Next month"]',
    )!;
    expect(next.disabled).toBe(true);
  });

  test("Home/End rove to the week's ends; Shift+PageUp flips a year", async () => {
    // Feb 11 2026 is a Wednesday; the Danish grid runs Monday–Sunday.
    await render(Fixture, { initial: "2026-02-11" });

    day("2026-02-11")!.focus();
    await userEvent.keyboard("{Home}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe(
        "2026-02-09",
      );
    });

    await userEvent.keyboard("{End}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe(
        "2026-02-15",
      );
    });

    // A whole-year flip replaces every cell — focus must follow across the
    // parking path, not fall to <body>.
    await userEvent.keyboard("{Shift>}{PageUp}{/Shift}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe(
        "2025-02-15",
      );
    });
    const grid = document.querySelector('[role="grid"]')!;
    expect(grid.getAttribute("aria-label")).toContain("2025");
  });

  test("isDateDisabled days are focusable aria-disabled cells that refuse picks", async () => {
    const onselect = vi.fn();
    await render(Fixture, {
      initial: "2026-02-10",
      isDateDisabled: (iso) => iso === "2026-02-11",
      onselect,
    });

    // Blocked, but NOT natively disabled — a disabled roving target would
    // drop the whole grid from the tab order (APG: keep it discoverable).
    const blocked = day("2026-02-11")!;
    expect(blocked.disabled).toBe(false);
    expect(blocked.getAttribute("aria-disabled")).toBe("true");

    // Roving lands on it; Enter is refused.
    day("2026-02-10")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe(
        "2026-02-11",
      );
    });
    await userEvent.keyboard("{Enter}");
    expect(onselect).not.toHaveBeenCalled();
  });

  test("out-of-bounds days keep NATIVE disabled", async () => {
    // Roving is clamped off min/max days entirely, so unfocusable is fine
    // there — only isDateDisabled days need the aria-disabled treatment.
    await render(Fixture, { initial: "2026-02-10", min: "2026-02-05" });

    expect(day("2026-02-04")?.disabled).toBe(true);
    expect(day("2026-02-04")?.getAttribute("aria-disabled")).toBeNull();
  });

  test("week numbers render the ISO weeks when enabled", async () => {
    await render(Fixture, { initial: "2026-01-05", showWeekNumbers: true });

    const headers = [...document.querySelectorAll('[role="rowheader"]')].map(
      (cell) => cell.textContent?.trim(),
    );
    // January 2026 with fixedWeeks spans ISO weeks 1..6.
    expect(headers).toEqual(["1", "2", "3", "4", "5", "6"]);
  });
});
