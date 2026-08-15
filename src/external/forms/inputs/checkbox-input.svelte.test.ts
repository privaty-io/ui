import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeCheckboxField, fakeForm } from "../testing/fakes.svelte";
import Fixture from "./checkbox-input.fixture.svelte";

describe("wiring", () => {
  test("renders the field's attributes as a checkbox", async () => {
    const { field } = fakeCheckboxField("inStock");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "In stock",
    });

    const checkbox = screen.getByLabelText("In stock");
    await expect.element(checkbox).toHaveAttribute("name", "inStock");
    await expect.element(checkbox).toHaveAttribute("type", "checkbox");
    await expect.element(checkbox).not.toBeChecked();
  });

  test("starts clean and follows toggles both ways", async () => {
    const { field, edit } = fakeCheckboxField("inStock");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "In stock",
    });

    expect(screen.component.state.isDirty).toBe(false);

    edit(true);
    expect(screen.component.state.isDirty).toBe(true);

    edit(false);
    expect(screen.component.state.isDirty).toBe(false);
  });

  test("seeds a checked initial value through the field", async () => {
    const { field } = fakeCheckboxField("inStock");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "In stock",
      initialValue: true,
    });

    await expect.element(screen.getByLabelText("In stock")).toBeChecked();
    expect(field.value()).toBe(true);
    expect(screen.component.state.isDirty).toBe(false);
  });

  test("disables while the form is submitting", async () => {
    const { field } = fakeCheckboxField("inStock");
    const { form, setPending } = fakeForm();
    const screen = await render(Fixture, { form, field, label: "In stock" });

    await expect.element(screen.getByLabelText("In stock")).not.toBeDisabled();

    setPending(1);

    await expect.element(screen.getByLabelText("In stock")).toBeDisabled();
  });
});

describe("issue display", () => {
  test("hides issues until the field is touched", async () => {
    const { field } = fakeCheckboxField("terms", {
      issues: [{ message: "required" }],
    });
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Terms",
    });

    await expect.element(screen.getByText("required")).not.toBeInTheDocument();

    screen.component.state.markTouched("terms");

    await expect.element(screen.getByText("required")).toBeInTheDocument();
  });
});
