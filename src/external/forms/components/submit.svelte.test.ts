import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeForm } from "../testing/fakes.svelte";
import type { FieldRegistration } from "../types/field";
import Fixture from "./submit.fixture.svelte";

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

describe("dirty-and-valid gate (default)", () => {
  test("disabled while pristine, enabled once dirty and valid", async () => {
    const { registration, edit } = editableRegistration("name");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      label: "Create",
      extraRegistrations: [registration],
    });

    const button = screen.getByRole("button", { name: "Create" });
    await expect.element(button).toBeDisabled();

    edit("something");

    await expect.element(button).not.toBeDisabled();
  });

  test("stays disabled while dirty but invalid", async () => {
    const { registration, edit } = editableRegistration("name");
    const { form, setIssues } = fakeForm();
    const screen = await render(Fixture, {
      form,
      label: "Create",
      extraRegistrations: [registration],
    });

    edit("something");
    setIssues([{ message: "required", path: ["name"] }]);

    await expect
      .element(screen.getByRole("button", { name: "Create" }))
      .toBeDisabled();
  });
});

describe("other gates", () => {
  test("valid: ignores dirtiness, follows validity", async () => {
    const { form, setIssues } = fakeForm();
    const screen = await render(Fixture, {
      form,
      label: "Create",
      disabledUntil: "valid",
    });

    const button = screen.getByRole("button", { name: "Create" });
    await expect.element(button).not.toBeDisabled();

    setIssues([{ message: "required", path: ["name"] }]);

    await expect.element(button).toBeDisabled();
  });

  test("none: only submitting disables", async () => {
    const { form, setIssues, setPending } = fakeForm();
    const screen = await render(Fixture, {
      form,
      label: "Create",
      disabledUntil: "none",
    });

    setIssues([{ message: "required", path: ["name"] }]);

    const button = screen.getByRole("button", { name: "Create" });
    await expect.element(button).not.toBeDisabled();

    setPending(1);

    await expect.element(button).toBeDisabled();
  });
});

describe("submitting", () => {
  test("disables and swaps to the submitting label", async () => {
    const { registration, edit } = editableRegistration("name");
    const { form, setPending } = fakeForm();
    const screen = await render(Fixture, {
      form,
      label: "Create",
      submittingLabel: "Creating",
      extraRegistrations: [registration],
    });

    edit("something");
    await expect
      .element(screen.getByRole("button", { name: "Create" }))
      .not.toBeDisabled();

    setPending(1);

    const submitting = screen.getByRole("button", { name: "Creating…" });
    await expect.element(submitting).toBeInTheDocument();
    await expect.element(submitting).toBeDisabled();
  });
});
