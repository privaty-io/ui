import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeForm } from "../testing/fakes.svelte";
import type { FieldRegistration } from "../types/field";
import Fixture from "./reset.fixture.svelte";

function editableRegistration(name: string) {
  let value = $state("");

  const registration: FieldRegistration = {
    name,
    initialValue: "",
    required: false,
    getValue: () => value,
    setValue: (next) => {
      value = next as string;
    },
  };

  return {
    registration,
    edit: (next: string) => {
      value = next;
    },
  };
}

describe("reset", () => {
  test("uses the configured default label and reset type", async () => {
    const screen = await render(Fixture, { form: fakeForm().form });

    const button = screen.getByRole("button", { name: "Reset" });
    await expect.element(button).toHaveAttribute("type", "reset");
  });

  test("accepts a label override and the configured label", async () => {
    const screen = await render(Fixture, {
      form: fakeForm().form,
      uiConfig: { labels: { form: { reset: "Nulstil" } } },
    });

    await expect
      .element(screen.getByRole("button", { name: "Nulstil" }))
      .toBeInTheDocument();
  });

  test("disabled while pristine, enabled once dirty", async () => {
    const { registration, edit } = editableRegistration("name");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      extraRegistrations: [registration],
    });

    const button = screen.getByRole("button", { name: "Reset" });
    await expect.element(button).toBeDisabled();

    edit("something");

    await expect.element(button).not.toBeDisabled();
  });

  test("disabled while submitting even when dirty", async () => {
    const { registration, edit } = editableRegistration("name");
    const { form, setPending } = fakeForm();
    const screen = await render(Fixture, {
      form,
      extraRegistrations: [registration],
    });

    edit("something");
    setPending(1);

    await expect
      .element(screen.getByRole("button", { name: "Reset" }))
      .toBeDisabled();
  });
});
