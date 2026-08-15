import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Select from "./select.svelte";

const options = ["cheese", "wine", "bread"];

describe("label association", () => {
  test.each(["top", "left", "hidden"] as const)(
    "the label reaches the select in the %s style",
    async (labelStyle) => {
      const screen = await render(Select, {
        label: "Category",
        labelStyle,
        options,
      });

      await expect
        .element(screen.getByLabelText("Category"))
        .toBeInTheDocument();
    },
  );
});

describe("options", () => {
  test("normalizes plain strings into value/label options", async () => {
    const screen = await render(Select, { label: "Category", options });

    const option = screen.getByRole("option", { name: "cheese" });
    await expect.element(option).toHaveValue("cheese");
  });

  test("renders object options with distinct value and label", async () => {
    const screen = await render(Select, {
      label: "Category",
      options: [
        { value: "cheese", label: "Ost" },
        { value: "wine", label: "Vin", disabled: true },
      ],
    });

    await expect
      .element(screen.getByRole("option", { name: "Ost" }))
      .toHaveValue("cheese");
    await expect
      .element(screen.getByRole("option", { name: "Vin" }))
      .toBeDisabled();
  });

  test("renders the placeholder as a disabled empty option", async () => {
    const screen = await render(Select, {
      label: "Category",
      options,
      placeholder: "Choose one",
    });

    const placeholder = screen.getByRole("option", { name: "Choose one" });
    await expect.element(placeholder).toHaveValue("");
    await expect.element(placeholder).toBeDisabled();
  });
});

describe("value", () => {
  test("renders a provided value as the selection", async () => {
    const screen = await render(Select, {
      label: "Category",
      options,
      value: "wine",
    });

    await expect.element(screen.getByLabelText("Category")).toHaveValue("wine");
  });
});

describe("errors", () => {
  test("renders errors and points aria-describedby at them", async () => {
    const screen = await render(Select, {
      label: "Category",
      options,
      id: "category",
      errors: ["Pick something."],
    });

    await expect
      .element(screen.getByText("Pick something."))
      .toBeInTheDocument();
    await expect
      .element(screen.getByLabelText("Category"))
      .toHaveAttribute("aria-describedby", "category-errors");
  });
});
