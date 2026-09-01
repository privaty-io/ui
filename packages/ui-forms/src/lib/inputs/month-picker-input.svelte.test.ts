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

  test("the trigger reports its expanded state", async () => {
    const { field } = fakeDateField("availableFrom");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Available from",
    });

    const trigger = screen.getByRole("button", { name: "Open calendar" });
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("a pick during submit is refused — readonly carriers take no writes", async () => {
    const { field, edit } = fakeDateField("availableFrom");
    const { form, setPending } = fakeForm();
    const screen = await render(Fixture, {
      form,
      field,
      label: "Available from",
      initialValue: "2026-02",
      syncField: edit,
    });

    await screen.getByRole("button", { name: "Open calendar" }).click();
    await vi.waitFor(() => expect(panel().matches(":popover-open")).toBe(true));

    // The submit starts while the panel is open — the pick must be refused
    // outright (no write, panel stays), not half-applied to a field Kit is
    // reading live.
    setPending(1);
    cell("2026-09")!.click();

    await expect
      .element(screen.getByLabelText("Available from"))
      .toHaveValue("2026-02");
    expect(field.value()).toBe(undefined);
    expect(panel().matches(":popover-open")).toBe(true);
  });

  test("header-dropdown navigation never reaches the field or the form", async () => {
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

    // Pure calendar navigation: the picker's unnamed year dropdown fires
    // bubbling input/change events, which the frame must contain — leaked,
    // they would count as edits to Kit's and the Form's form-level
    // listeners (validation chatter, corrupted field writes).
    const year = document.querySelector<HTMLSelectElement>(
      'select[aria-label="Year"]',
    )!;
    year.value = "2027";
    year.dispatchEvent(new Event("input", { bubbles: true }));
    year.dispatchEvent(new Event("change", { bubbles: true }));

    expect(field.value()).toBe(undefined);
    expect(screen.component.state.isDirty).toBe(false);
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
