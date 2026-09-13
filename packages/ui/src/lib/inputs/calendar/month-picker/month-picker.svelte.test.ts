import { userEvent } from "vitest/browser";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import Fixture from "./month-picker.fixture.svelte";

const month = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);

describe("month picker", () => {
  test("a disabling year flip keeps focus in the composite", async () => {
    // PageUp clamps 2026-03 to 2025-11 (min); the focused March button is
    // REUSED (position keys) but flips to disabled in 2025, which drops
    // focus — the parking must keep rapid keystrokes in the grid.
    await render(Fixture, { initial: "2026-03", min: "2025-11" });

    month("2026-03")!.focus();
    await userEvent.keyboard("{PageUp}{PageUp}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe("2025-11");
    });
  });

  test("malformed min/max degrade to no bound, no poisoned clamp", async () => {
    await render(Fixture, { initial: "2026-05", min: "garbage", max: "26-13" });

    expect(month("2026-05")?.tabIndex).toBe(0);
    expect(month("2026-05")?.disabled).toBe(false);
  });

  test("roving past max lands ON max", async () => {
    await render(Fixture, { initial: "2026-10", max: "2026-11" });

    month("2026-10")!.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe("2026-11");
    });
  });

  test("initial active clamps into [min,max] so the grid keeps its tab stop", async () => {
    // See DatePicker's clamp spec — same lost-tab-stop failure otherwise.
    await render(Fixture, { min: "2091-03", max: "2091-11" });

    expect(month("2091-03")?.tabIndex).toBe(0);
    expect(month("2091-03")?.disabled).toBe(false);
  });

  test("renders the value's year and selects months", async () => {
    const onselect = vi.fn();
    const screen = await render(Fixture, { initial: "2026-02", onselect });

    // Danish month names, twelve cells.
    expect(document.querySelectorAll("button[data-iso]").length).toBe(12);
    expect(month("2026-02")?.getAttribute("aria-selected")).toBe("true");
    expect(month("2026-02")?.textContent).toContain("feb");

    month("2026-09")!.click();
    await expect
      .element(screen.getByTestId("value"))
      .toHaveTextContent("2026-09");
    expect(onselect).toHaveBeenCalledWith("2026-09");
  });

  test("keyboard roves by month and row; PageDown jumps a year", async () => {
    const screen = await render(Fixture, { initial: "2026-02" });

    month("2026-02")!.focus();
    await userEvent.keyboard("{ArrowDown}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe("2026-05");
    });

    await userEvent.keyboard("{PageDown}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe("2027-05");
    });

    await userEvent.keyboard("{Enter}");
    await expect
      .element(screen.getByTestId("value"))
      .toHaveTextContent("2027-05");
  });

  test("the year dropdown jumps directly", async () => {
    await render(Fixture, { initial: "2026-02" });

    const year = document.querySelector<HTMLSelectElement>(
      'select[aria-label="Year"]',
    )!;
    year.value = "2031";
    year.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() => {
      expect(month("2031-02")).not.toBeNull();
      expect(month("2031-02")?.tabIndex).toBe(0);
    });
  });

  test("navigation clamps to min/max", async () => {
    await render(Fixture, { initial: "2026-06", min: "2026-03" });

    // PageUp toward min lands ON min, and the previous-year chevron is off.
    month("2026-06")!.focus();
    await userEvent.keyboard("{PageUp}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-iso")).toBe("2026-03");
    });
    const previous = document.querySelector<HTMLButtonElement>(
      'button[title="Previous year"]',
    )!;
    expect(previous.disabled).toBe(true);
  });

  test("min disables earlier months", async () => {
    const screen = await render(Fixture, {
      initial: "2026-06",
      min: "2026-03",
    });

    expect(month("2026-02")?.disabled).toBe(true);
    expect(month("2026-03")?.disabled).toBe(false);

    month("2026-02")!.click();
    await expect
      .element(screen.getByTestId("value"))
      .toHaveTextContent("2026-06");
  });
});
