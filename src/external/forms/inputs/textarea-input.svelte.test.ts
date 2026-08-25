import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeForm, fakeTextField } from "../testing/fakes.svelte";
import Fixture from "./textarea-input.fixture.svelte";

describe("wiring", () => {
  test("renders the field's attributes on a textarea element", async () => {
    const { field } = fakeTextField("description");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Description",
      rows: 5,
    });

    const textarea = screen.getByLabelText("Description");
    await expect.element(textarea).toHaveAttribute("name", "description");
    await expect.element(textarea).toHaveAttribute("rows", "5");
    expect(textarea.element().tagName).toBe("TEXTAREA");
  });

  test("seeds the initial value and stays clean until edited", async () => {
    const { field, edit } = fakeTextField("description");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Description",
      initialValue: "A fine cheese.",
    });

    await expect
      .element(screen.getByLabelText("Description"))
      .toHaveValue("A fine cheese.");
    expect(screen.component.state.isDirty).toBe(false);

    edit("A very fine cheese.");
    expect(screen.component.state.isDirty).toBe(true);

    edit("A fine cheese.");
    expect(screen.component.state.isDirty).toBe(false);
  });

  test("locks via readonly while submitting, never disabled", async () => {
    const { field } = fakeTextField("description");
    const { form, setPending } = fakeForm();
    const screen = await render(Fixture, {
      form,
      field,
      label: "Description",
    });

    setPending(1);

    const textarea = screen.getByLabelText("Description");
    await expect.element(textarea).not.toBeDisabled();
    await expect.element(textarea).toHaveAttribute("readonly");
  });
});

describe("issue display", () => {
  test("hides issues until the field is touched", async () => {
    const { field } = fakeTextField("description", {
      issues: [{ message: "too-long" }],
    });
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Description",
    });

    await expect.element(screen.getByText("too-long")).not.toBeInTheDocument();

    screen.component.state.markTouched("description");

    await expect.element(screen.getByText("too-long")).toBeInTheDocument();
  });
});
