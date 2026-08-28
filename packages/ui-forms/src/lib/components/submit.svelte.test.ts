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
    normalize: (next) => next,
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

describe("labels", () => {
  test("defaults to the configured submit label", async () => {
    const screen = await render(Fixture, {
      form: fakeForm().form,
      disabledUntil: "none",
    });

    await expect
      .element(screen.getByRole("button", { name: "Submit" }))
      .toBeInTheDocument();
  });

  test("uses a configured label over the default", async () => {
    const screen = await render(Fixture, {
      form: fakeForm().form,
      disabledUntil: "none",
      uiConfig: { labels: { form: { submit: "Opret" } } },
    });

    await expect
      .element(screen.getByRole("button", { name: "Opret" }))
      .toBeInTheDocument();
  });
});

describe("submitting", () => {
  test("disables, shows the spinner, and swaps to the submitting label", async () => {
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

    const submitting = screen.getByRole("button", { name: "Creating" });
    await expect.element(submitting).toBeInTheDocument();
    await expect.element(submitting).toBeDisabled();
    await expect.element(submitting).toHaveAttribute("aria-busy", "true");
    expect(screen.container.querySelector("svg.animate-spin")).not.toBeNull();
  });

  test("keeps the accessible name when only the spinner is visible", async () => {
    const { form, setPending } = fakeForm();
    const screen = await render(Fixture, { form, label: "Create" });

    setPending(1);

    const button = screen.getByRole("button", { name: "Create" });
    await expect.element(button).toBeInTheDocument();
    expect(screen.container.querySelector("svg.animate-spin")).not.toBeNull();
    expect(screen.container.querySelector("span.sr-only")).not.toBeNull();
  });
});
