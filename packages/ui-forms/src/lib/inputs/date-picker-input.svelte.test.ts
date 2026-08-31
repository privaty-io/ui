import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeDateField, fakeForm } from "../testing/fakes.svelte";
import Fixture from "./date-picker-input.fixture.svelte";

const day = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);
const panel = () => document.querySelector<HTMLElement>("[popover]")!;

describe("wiring", () => {
  test("renders a native date carrier with the field's attributes", async () => {
    const { field } = fakeDateField("bakedOn");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Baked on",
      min: "2026-01-05",
      max: "2026-12-24",
    });

    const input = screen.getByLabelText("Baked on");
    await expect.element(input).toHaveAttribute("name", "bakedOn");
    await expect.element(input).toHaveAttribute("type", "date");
    await expect.element(input).toHaveAttribute("min", "2026-01-05");
    await expect.element(input).toHaveAttribute("max", "2026-12-24");
  });

  test("a pick writes the input the way typing does and closes", async () => {
    const { field, edit } = fakeDateField("bakedOn");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Baked on",
      initialValue: "2026-02-05",
      syncField: edit,
    });

    await screen.getByRole("button", { name: "Open calendar" }).click();
    await vi.waitFor(() => expect(panel().matches(":popover-open")).toBe(true));

    // The picker highlights the field's current value.
    expect(day("2026-02-05")?.getAttribute("aria-selected")).toBe("true");

    day("2026-02-14")!.click();

    // The DOM value plus a bubbling input event is exactly what typing
    // produces — the fixture's syncField wrapper (standing in for Kit's
    // form-level listener) proves the event escaped the component.
    await expect
      .element(screen.getByLabelText("Baked on"))
      .toHaveValue("2026-02-14");
    expect(field.value()).toBe("2026-02-14");
    await vi.waitFor(() =>
      expect(panel().matches(":popover-open")).toBe(false),
    );
    expect(screen.component.state.isDirty).toBe(true);
  });

  test("locks while submitting: input readonly, trigger disabled", async () => {
    const { field } = fakeDateField("bakedOn");
    const { form, setPending } = fakeForm();
    const screen = await render(Fixture, {
      form,
      field,
      label: "Baked on",
    });

    setPending(1);

    const input = screen.getByLabelText("Baked on");
    await expect.element(input).not.toBeDisabled();
    await expect.element(input).toHaveAttribute("readonly");
    await expect
      .element(screen.getByRole("button", { name: "Open calendar" }))
      .toBeDisabled();
  });

  test("min/max reach the picker as disabled days", async () => {
    const { field } = fakeDateField("bakedOn");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Baked on",
      initialValue: "2026-02-10",
      min: "2026-02-05",
      max: "2026-02-20",
    });

    await screen.getByRole("button", { name: "Open calendar" }).click();
    await vi.waitFor(() => expect(panel().matches(":popover-open")).toBe(true));

    expect(day("2026-02-04")?.disabled).toBe(true);
    expect(day("2026-02-05")?.disabled).toBe(false);
    expect(day("2026-02-21")?.disabled).toBe(true);
  });
});

describe("issue display", () => {
  test("hides issues until the field is touched", async () => {
    const { field } = fakeDateField("bakedOn", {
      issues: [{ message: "required" }],
    });
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Baked on",
    });

    await expect.element(screen.getByText("required")).not.toBeInTheDocument();

    screen.component.state.markTouched("bakedOn");

    await expect.element(screen.getByText("required")).toBeInTheDocument();
  });
});
