import { userEvent } from "vitest/browser";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import Fixture from "./week-picker.fixture.svelte";

const week = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);

describe("week picker", () => {
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
