import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeDateField, fakeForm } from "../testing/fakes.svelte";
import Fixture from "./week-picker-input.fixture.svelte";

const row = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);
const panel = () => document.querySelector<HTMLElement>("[popover]")!;

// The shared frame mechanics live in date-picker-input's specs — these
// cover the week-specific carrier type and value format.
describe("week picker input", () => {
  test("renders a native week carrier", async () => {
    const { field } = fakeDateField("deliveryWeek");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Delivery week",
    });

    const input = screen.getByLabelText("Delivery week");
    await expect.element(input).toHaveAttribute("name", "deliveryWeek");
    await expect.element(input).toHaveAttribute("type", "week");
  });

  test("a pick writes the 'YYYY-Www' value through and closes", async () => {
    const { field, edit } = fakeDateField("deliveryWeek");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Delivery week",
      initialValue: "2026-W06",
      syncField: edit,
    });

    await screen.getByRole("button", { name: "Open calendar" }).click();
    await vi.waitFor(() => expect(panel().matches(":popover-open")).toBe(true));

    // Week 6 of 2026 sits in February — week 9 shares the month's grid.
    row("2026-W09")!.click();

    await expect
      .element(screen.getByLabelText("Delivery week"))
      .toHaveValue("2026-W09");
    expect(field.value()).toBe("2026-W09");
    await vi.waitFor(() =>
      expect(panel().matches(":popover-open")).toBe(false),
    );
  });
});
