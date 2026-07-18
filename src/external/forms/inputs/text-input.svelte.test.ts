import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeForm, fakeTextField } from "../testing/fakes.svelte";
import type { FieldRegistration } from "../types/field";
import Fixture from "./text-input.fixture.svelte";

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
  test("renders the field's attributes through the core input", async () => {
    const { field } = fakeTextField("name");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Name",
      type: "email",
    });

    const input = screen.getByLabelText("Name");
    await expect.element(input).toHaveAttribute("name", "name");
    await expect.element(input).toHaveAttribute("type", "email");
  });

  test("seeds the initial value and stays clean until edited", async () => {
    const { field, edit } = fakeTextField("name");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Name",
      initialValue: "Ost",
    });

    await expect.element(screen.getByLabelText("Name")).toHaveValue("Ost");
    expect(screen.component.state.isDirty).toBe(false);

    edit("Brie");
    expect(screen.component.state.isDirty).toBe(true);

    edit("Ost");
    expect(screen.component.state.isDirty).toBe(false);
  });

  test("unregisters on unmount", async () => {
    const { field } = fakeTextField("name");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Name",
    });

    await screen.unmount();

    expect(() =>
      screen.component.state.register(registration("name")),
    ).not.toThrow();
  });

  test("becomes readonly while the form is submitting", async () => {
    const { field } = fakeTextField("name");
    const { form, setPending } = fakeForm();
    const screen = await render(Fixture, { form, field, label: "Name" });

    await expect
      .element(screen.getByLabelText("Name"))
      .not.toHaveAttribute("readonly");

    setPending(1);

    await expect
      .element(screen.getByLabelText("Name"))
      .toHaveAttribute("readonly");
  });
});

describe("issue display", () => {
  test("hides issues until the field is touched", async () => {
    const { field } = fakeTextField("name", {
      issues: [{ message: "required" }],
    });
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Name",
    });

    await expect.element(screen.getByText("required")).not.toBeInTheDocument();

    screen.component.state.markTouched("name");

    await expect.element(screen.getByText("required")).toBeInTheDocument();
  });

  test("shows issues after a submit attempt", async () => {
    const { field } = fakeTextField("name", {
      issues: [{ message: "required" }],
    });
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Name",
    });

    screen.component.state.submitAttempted = true;

    await expect.element(screen.getByText("required")).toBeInTheDocument();
  });

  test("resolves messages through the configured resolver", async () => {
    const validatorMessage: Record<string, string> = {
      required: "Feltet skal udfyldes.",
    };
    const { field } = fakeTextField("name", {
      issues: [{ message: "required" }],
    });
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Name",
      uiConfig: {
        resolveMessage: (issue) =>
          validatorMessage[issue.message] ?? issue.message,
      },
    });

    screen.component.state.submitAttempted = true;

    await expect
      .element(screen.getByText("Feltet skal udfyldes."))
      .toBeInTheDocument();
  });
});

describe("required markers", () => {
  test("marks the optional field when most fields are required", async () => {
    const { field } = fakeTextField("name");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Name",
      extraRegistrations: [registration("other", { required: true })],
    });

    await expect.element(screen.getByText("(optional)")).toBeInTheDocument();
  });

  test("uses the configured optional label", async () => {
    const { field } = fakeTextField("name");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Name",
      extraRegistrations: [registration("other", { required: true })],
      uiConfig: { labels: { form: { optional: "(valgfri)" } } },
    });

    await expect.element(screen.getByText("(valgfri)")).toBeInTheDocument();
  });

  test("marks the required field when most fields are optional", async () => {
    const { field } = fakeTextField("name");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Name",
      required: true,
      extraRegistrations: [registration("other"), registration("another")],
    });

    await expect.element(screen.getByText("*")).toBeInTheDocument();
  });

  test("shows no marker on the required field when required is the tied majority", async () => {
    const { field } = fakeTextField("name");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Name",
      required: true,
      extraRegistrations: [registration("other")],
    });

    await expect.element(screen.getByText("*")).not.toBeInTheDocument();
  });
});
