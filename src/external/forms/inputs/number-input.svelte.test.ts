import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeForm, fakeNumberField } from "../testing/fakes.svelte";
import type { FieldRegistration } from "../types/field";
import Fixture from "./number-input.fixture.svelte";

function registration(
  name: string,
  overrides: Partial<FieldRegistration> = {},
): FieldRegistration {
  return {
    name,
    initialValue: "",
    required: false,
    getValue: () => "",
    setValue: () => {},
    ...overrides,
  };
}

describe("wiring", () => {
  test("renders the field's attributes and number natives", async () => {
    const { field } = fakeNumberField("price");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Price",
      min: 0,
      max: 100,
      step: 5,
    });

    const input = screen.getByLabelText("Price");
    await expect.element(input).toHaveAttribute("name", "price");
    await expect.element(input).toHaveAttribute("type", "number");
    await expect.element(input).toHaveAttribute("min", "0");
    await expect.element(input).toHaveAttribute("max", "100");
    await expect.element(input).toHaveAttribute("step", "5");
  });

  test("starts clean without a seed and follows edits both ways", async () => {
    const { field, edit } = fakeNumberField("price");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Price",
    });

    expect(screen.component.state.isDirty).toBe(false);

    edit(10);
    expect(screen.component.state.isDirty).toBe(true);

    edit(undefined);
    expect(screen.component.state.isDirty).toBe(false);
  });

  test("seeds the initial value and stays clean until edited", async () => {
    const { field, edit } = fakeNumberField("price");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Price",
      initialValue: 10,
    });

    await expect.element(screen.getByLabelText("Price")).toHaveValue(10);
    expect(screen.component.state.isDirty).toBe(false);

    edit(20);
    expect(screen.component.state.isDirty).toBe(true);

    edit(10);
    expect(screen.component.state.isDirty).toBe(false);
  });
});

describe("issue display", () => {
  test("hides issues until the field is touched", async () => {
    const { field } = fakeNumberField("price", {
      issues: [{ message: "too-small" }],
    });
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Price",
    });

    await expect.element(screen.getByText("too-small")).not.toBeInTheDocument();

    screen.component.state.markTouched("price");

    await expect.element(screen.getByText("too-small")).toBeInTheDocument();
  });
});

describe("required markers", () => {
  test("marks the optional field when most fields are required", async () => {
    const { field } = fakeNumberField("price");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Price",
      extraRegistrations: [registration("other", { required: true })],
    });

    await expect.element(screen.getByText("(optional)")).toBeInTheDocument();
  });
});
