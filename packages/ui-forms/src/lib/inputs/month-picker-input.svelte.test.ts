import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeDateField, fakeForm } from "../testing/fakes.svelte";
import Fixture from "./month-picker-input.fixture.svelte";

const cell = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);
const panel = () => document.querySelector<HTMLElement>("[popover]")!;

// The shared frame mechanics live in date-picker-input's specs — these
// cover the month-specific carrier type and value format.
describe("month picker input", () => {
  test("renders a native month carrier", async () => {
    const { field } = fakeDateField("availableFrom");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Available from",
    });

    const input = screen.getByLabelText("Available from");
    await expect.element(input).toHaveAttribute("name", "availableFrom");
    await expect.element(input).toHaveAttribute("type", "month");
  });

  test("a pick writes the 'YYYY-MM' value through and closes", async () => {
    const { field, edit } = fakeDateField("availableFrom");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Available from",
      initialValue: "2026-02",
      syncField: edit,
    });

    await screen.getByRole("button", { name: "Open calendar" }).click();
    await vi.waitFor(() => expect(panel().matches(":popover-open")).toBe(true));

    cell("2026-09")!.click();

    await expect
      .element(screen.getByLabelText("Available from"))
      .toHaveValue("2026-09");
    expect(field.value()).toBe("2026-09");
    await vi.waitFor(() =>
      expect(panel().matches(":popover-open")).toBe(false),
    );
  });
});
