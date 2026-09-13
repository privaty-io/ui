import { userEvent } from "vitest/browser";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import Fixture from "./week-picker.fixture.svelte";

const week = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);

describe("week picker", () => {
  test("malformed min/max degrade to no bound, no poisoned clamp", async () => {
    await render(Fixture, {
      initial: "2026-W10",
      min: "garbage",
      max: "2026-13",
    });

    expect(week("2026-W10")?.tabIndex).toBe(0);
    expect(week("2026-W10")?.disabled).toBe(false);
  });

  test("stepping across the year seam moves one real ISO week", async () => {
    // 2026-W01's Thursday is Jan 1 2026; one week up is 2025-W52 with its
    // Thursday on Dec 25 2025 — the view must flip to December.
    await render(Fixture, { initial: "2026-W01" });

    week("2026-W01")!.focus();
    await userEvent.keyboard("{ArrowUp}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe("2025-W52");
    });

    await userEvent.keyboard("{ArrowDown}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe("2026-W01");
    });
  });

  test("Home/End rove to the month's first and last weeks", async () => {
    // February 2026 renders W05 through W09.
    await render(Fixture, { initial: "2026-W07" });

    week("2026-W07")!.focus();
    await userEvent.keyboard("{Home}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe("2026-W05");
    });

    await userEvent.keyboard("{End}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe("2026-W09");
    });
  });

  test("roving past max lands ON max; the next chevron disables", async () => {
    // maxView = March 2026 (W11's Thursday is Mar 12).
    await render(Fixture, { initial: "2026-W10", max: "2026-W11" });

    week("2026-W10")!.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe("2026-W11");
    });

    const next = document.querySelector<HTMLButtonElement>(
      'button[title="Next month"]',
    )!;
    expect(next.disabled).toBe(true);
  });

  test("follows an external value change after mount", async () => {
    const screen = await render(Fixture, { initial: "2026-W06" });

    expect(week("2026-W06")?.getAttribute("aria-selected")).toBe("true");

    // A parent writing the bound value (async record load, a paired
    // control) must flip the view to the new week's month and move the
    // roving tab stop — the writable-derived contract the other pickers
    // already keep.
    screen.component.setValue("2026-W33");
    await vi.waitFor(() => {
      expect(week("2026-W33")?.getAttribute("aria-selected")).toBe("true");
      expect(week("2026-W33")?.tabIndex).toBe(0);
    });
  });

  test("the year dropdown clamps like the chevrons, and parking lands ON min", async () => {
    // minView = May 2026 (the month of W20's Thursday).
    await render(Fixture, { initial: "2026-W30", min: "2026-W20" });

    const year = document.querySelector<HTMLSelectElement>(
      'select[aria-label="Year"]',
    )!;
    const month = document.querySelector<HTMLSelectElement>(
      'select[aria-label="Month"]',
    )!;

    // Detour through 2027 (where February is enabled), then drop the year
    // back below the window: the view must clamp to May 2026, not land on
    // February 2026 where every row is disabled.
    year.value = "2027";
    year.dispatchEvent(new Event("change", { bubbles: true }));
    month.value = "2";
    month.dispatchEvent(new Event("change", { bubbles: true }));
    year.value = "2026";
    year.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() => {
      expect(month.value).toBe("5");
      // The active row parks on the CLAMPED first week — W18 opens May's
      // grid but lies before min, so the tab stop must land on W20.
      expect(week("2026-W18")?.disabled).toBe(true);
      expect(week("2026-W20")?.tabIndex).toBe(0);
    });
  });

  test("renders the bound week's month and selects whole weeks", async () => {
    const onselect = vi.fn();
    const screen = await render(Fixture, { initial: "2026-W06", onselect });

    // Week 6 of 2026 lies in February — its row is selected.
    expect(week("2026-W06")?.getAttribute("aria-selected")).toBe("true");

    week("2026-W08")!.click();
    await expect
      .element(screen.getByTestId("value"))
      .toHaveTextContent("2026-W08");
    expect(onselect).toHaveBeenCalledWith("2026-W08");
  });

  test("arrow keys rove; past the last row navigates the month", async () => {
    await render(Fixture, { initial: "2026-W06" });

    week("2026-W06")!.focus();
    await userEvent.keyboard("{ArrowDown}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe("2026-W07");
    });

    // February 2026 ends with week 9; one more step flips to March.
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe("2026-W10");
    });
    expect(
      document.querySelector('[role="listbox"]')?.getAttribute("aria-label"),
    ).toContain("marts");
  });

  test("header dropdowns jump the displayed month", async () => {
    await render(Fixture, { initial: "2026-W06" });

    const year = document.querySelector<HTMLSelectElement>(
      'select[aria-label="Year"]',
    )!;
    year.value = "2024";
    year.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() => {
      // February 2024 contains ISO week 6 of 2024.
      expect(week("2024-W06")).not.toBeNull();
    });
  });

  test("navigation clamps to min/max", async () => {
    await render(Fixture, {
      initial: "2026-W06",
      min: "2026-W05",
      max: "2026-W12",
    });

    // Roving above min lands ON min.
    week("2026-W06")!.focus();
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe("2026-W05");
    });

    // Week 5's month (its Thursday sits in January) bounds the chevron.
    const previous = document.querySelector<HTMLButtonElement>(
      'button[title="Previous month"]',
    )!;
    expect(previous.disabled).toBe(true);
  });

  test("year-boundary weeks carry the ISO week-year", async () => {
    await render(Fixture, { initial: "2026-W53" });

    // Week 53 of 2026 spans into January 2027 — the row exists either way.
    expect(week("2026-W53")).not.toBeNull();
    expect(week("2026-W53")?.getAttribute("aria-selected")).toBe("true");
  });
});
