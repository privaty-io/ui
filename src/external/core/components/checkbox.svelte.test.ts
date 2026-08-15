import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Checkbox from "./checkbox.svelte";

describe("checkbox", () => {
  test("associates the label with a checkbox input", async () => {
    const screen = await render(Checkbox, { label: "In stock" });

    const checkbox = screen.getByLabelText("In stock");
    await expect.element(checkbox).toHaveAttribute("type", "checkbox");
    await expect.element(checkbox).not.toBeChecked();
  });

  test("toggles when clicked", async () => {
    const screen = await render(Checkbox, { label: "In stock" });

    const checkbox = screen.getByLabelText("In stock");
    await checkbox.click();

    await expect.element(checkbox).toBeChecked();
  });

  test("renders a provided checked state", async () => {
    const screen = await render(Checkbox, { label: "In stock", checked: true });

    await expect.element(screen.getByLabelText("In stock")).toBeChecked();
  });

  test("renders the marker next to the label", async () => {
    const screen = await render(Checkbox, {
      label: "Terms",
      marker: "*",
    });

    await expect.element(screen.getByText("*")).toBeInTheDocument();
  });

  test("renders errors and points aria-describedby at them", async () => {
    const screen = await render(Checkbox, {
      label: "Terms",
      id: "terms",
      errors: ["You must accept."],
    });

    await expect
      .element(screen.getByText("You must accept."))
      .toBeInTheDocument();
    await expect
      .element(screen.getByLabelText("Terms"))
      .toHaveAttribute("aria-describedby", "terms-errors");
  });
});
