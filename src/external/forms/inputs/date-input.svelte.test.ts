import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeDateField, fakeForm } from "../testing/fakes.svelte";
import Fixture from "./date-input.fixture.svelte";

describe("wiring", () => {
  test("renders the field's attributes for the chosen date type", async () => {
    const { field } = fakeDateField("availableFrom");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Available from",
      type: "month",
    });

    const input = screen.getByLabelText("Available from");
    await expect.element(input).toHaveAttribute("name", "availableFrom");
    await expect.element(input).toHaveAttribute("type", "month");
  });

  test("defaults to a plain date input", async () => {
    const { field } = fakeDateField("bakedOn");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Baked on",
    });

    await expect
      .element(screen.getByLabelText("Baked on"))
      .toHaveAttribute("type", "date");
  });

  test("seeds the initial value and stays clean until edited", async () => {
    const { field, edit } = fakeDateField("availableFrom");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Available from",
      type: "month",
      initialValue: "2026-08",
    });

    await expect
      .element(screen.getByLabelText("Available from"))
      .toHaveValue("2026-08");
    expect(screen.component.state.isDirty).toBe(false);

    edit("2026-09");
    expect(screen.component.state.isDirty).toBe(true);

    edit("2026-08");
    expect(screen.component.state.isDirty).toBe(false);
  });

  test("locks via readonly while submitting, never disabled", async () => {
    const { field } = fakeDateField("availableFrom");
    const { form, setPending } = fakeForm();
    const screen = await render(Fixture, {
      form,
      field,
      label: "Available from",
      type: "month",
    });

    setPending(1);

    // Disabled controls are excluded from FormData — readonly locks the
    // control without losing its value mid-submission.
    const input = screen.getByLabelText("Available from");
    await expect.element(input).not.toBeDisabled();
    await expect.element(input).toHaveAttribute("readonly");
  });
});

describe("issue display", () => {
  test("hides issues until the field is touched", async () => {
    const { field } = fakeDateField("availableFrom", {
      issues: [{ message: "required" }],
    });
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Available from",
      type: "month",
    });

    await expect.element(screen.getByText("required")).not.toBeInTheDocument();

    screen.component.state.markTouched("availableFrom");

    await expect.element(screen.getByText("required")).toBeInTheDocument();
  });
});
