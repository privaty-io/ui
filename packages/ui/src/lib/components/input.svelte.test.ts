import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Input from "./input.svelte";

describe("label association", () => {
  test.each(["top", "left", "floating", "hidden"] as const)(
    "the label reaches the input in the %s style",
    async (labelStyle) => {
      const screen = await render(Input, { label: "Name", labelStyle });

      await expect.element(screen.getByLabelText("Name")).toBeInTheDocument();
    },
  );

  test("uses a provided id over the generated one", async () => {
    const screen = await render(Input, { label: "Name", id: "custom" });

    await expect
      .element(screen.getByLabelText("Name"))
      .toHaveAttribute("id", "custom");
  });

  test("visually hides the label in the hidden style", async () => {
    const screen = await render(Input, { label: "Name", labelStyle: "hidden" });

    expect(
      screen.container.querySelector("label")?.classList.contains("sr-only"),
    ).toBe(true);
  });
});

describe("marker", () => {
  test("renders the marker text next to the label", async () => {
    const screen = await render(Input, {
      label: "Name",
      marker: "(optional)",
    });

    await expect.element(screen.getByText("(optional)")).toBeInTheDocument();
  });
});

describe("errors", () => {
  test("renders errors and points aria-describedby at them", async () => {
    const screen = await render(Input, {
      label: "Name",
      id: "field",
      errors: ["Too short.", "Needs a number."],
    });

    await expect.element(screen.getByText("Too short.")).toBeInTheDocument();
    await expect
      .element(screen.getByText("Needs a number."))
      .toBeInTheDocument();
    await expect
      .element(screen.getByLabelText("Name"))
      .toHaveAttribute("aria-describedby", "field-errors");
  });

  test("omits aria-describedby without errors", async () => {
    const screen = await render(Input, { label: "Name" });

    await expect
      .element(screen.getByLabelText("Name"))
      .not.toHaveAttribute("aria-describedby");
  });
});

describe("native attribute passthrough", () => {
  test("rest props reach the input", async () => {
    const screen = await render(Input, {
      label: "Password",
      type: "password",
      autocomplete: "current-password",
    });

    const input = screen.getByLabelText("Password");
    await expect.element(input).toHaveAttribute("type", "password");
    await expect
      .element(input)
      .toHaveAttribute("autocomplete", "current-password");
  });

  test("passes placeholders through in non-floating styles", async () => {
    const screen = await render(Input, {
      label: "Name",
      placeholder: "Your name",
    });

    await expect
      .element(screen.getByLabelText("Name"))
      .toHaveAttribute("placeholder", "Your name");
  });

  test("forces the blank placeholder in the floating style", async () => {
    const screen = await render(Input, {
      label: "Name",
      labelStyle: "floating",
      placeholder: "ignored",
    });

    await expect
      .element(screen.getByLabelText("Name"))
      .toHaveAttribute("placeholder", " ");
  });
});

describe("value", () => {
  test("renders a provided value", async () => {
    const screen = await render(Input, { label: "Name", value: "seeded" });

    await expect.element(screen.getByLabelText("Name")).toHaveValue("seeded");
  });

  test("accepts typing when unbound", async () => {
    const screen = await render(Input, { label: "Name" });

    const input = screen.getByLabelText("Name");
    await input.fill("typed by hand");

    await expect.element(input).toHaveValue("typed by hand");
  });
});
