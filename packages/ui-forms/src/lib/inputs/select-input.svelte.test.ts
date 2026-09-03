import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeForm, fakeSelectField } from "../testing/fakes.svelte";
import Fixture from "./select-input.fixture.svelte";

const options = ["cheese", "wine", "bread"];

describe("wiring", () => {
  test("renders the field's attributes and the options", async () => {
    const { field } = fakeSelectField("category");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Category",
      options,
      placeholder: "Choose one",
    });

    const select = screen.getByLabelText("Category");
    await expect.element(select).toHaveAttribute("name", "category");
    await expect
      .element(screen.getByRole("option", { name: "wine" }))
      .toHaveValue("wine");
    // Not required, so the placeholder labels a SELECTABLE empty option —
    // the user can unselect. The schema-side `required` never becomes the
    // native attribute; it drives Select's clearable instead.
    await expect
      .element(screen.getByRole("option", { name: "Choose one" }))
      .not.toBeDisabled();
    await expect.element(select).not.toHaveAttribute("required");
  });

  test("required turns the placeholder into a disabled prompt", async () => {
    const { field } = fakeSelectField("category");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Category",
      options,
      placeholder: "Choose one",
      required: true,
    });

    await expect
      .element(screen.getByRole("option", { name: "Choose one" }))
      .toBeDisabled();
    await expect
      .element(screen.getByLabelText("Category"))
      .not.toHaveAttribute("required");
  });

  test("defaults an unseeded field to the placeholder", async () => {
    const { field } = fakeSelectField("category");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Category",
      options,
      placeholder: "Choose one",
    });

    // Seeded with "" so the disabled placeholder option is truly selected —
    // otherwise browsers pick the first enabled option while the field state
    // stays unset.
    await expect.element(screen.getByLabelText("Category")).toHaveValue("");
    expect(screen.component.state.isDirty).toBe(false);
  });

  test("seeds the initial value and stays clean until edited", async () => {
    const { field, edit } = fakeSelectField("category");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Category",
      options,
      initialValue: "wine",
    });

    await expect.element(screen.getByLabelText("Category")).toHaveValue("wine");
    expect(screen.component.state.isDirty).toBe(false);

    // The seed rides the option's selected attribute so a native reset
    // returns to it instead of the browser's first-option fallback.
    await expect
      .element(screen.getByRole("option", { name: "wine" }))
      .toHaveAttribute("selected");

    edit("bread");
    expect(screen.component.state.isDirty).toBe(true);

    edit("wine");
    expect(screen.component.state.isDirty).toBe(false);
  });

  test("locks interaction while submitting without leaving the form data", async () => {
    const { field } = fakeSelectField("category");
    const { form, setPending } = fakeForm();
    const screen = await render(Fixture, {
      form,
      field,
      label: "Category",
      options,
    });

    setPending(1);

    // NEVER disabled while submitting — disabled controls are excluded from
    // FormData, which made mid-submission validation lose the field entirely.
    const select = screen.getByLabelText("Category");
    await expect.element(select).not.toBeDisabled();
    await expect
      .element(select)
      .toHaveClass(/(?:^|\s)pointer-events-none(?:\s|$)/);
  });
});

describe("issue display", () => {
  test("hides issues until the field is touched", async () => {
    const { field } = fakeSelectField("category", {
      issues: [{ message: "required" }],
    });
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Category",
      options,
    });

    await expect.element(screen.getByText("required")).not.toBeInTheDocument();

    screen.component.state.markTouched("category");

    await expect.element(screen.getByText("required")).toBeInTheDocument();
  });
});
