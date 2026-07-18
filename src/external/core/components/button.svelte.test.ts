import { createRawSnippet } from "svelte";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Button from "./button.svelte";

function label(text: string) {
  return createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));
}

describe("button", () => {
  test("renders its children", async () => {
    const screen = await render(Button, { children: label("Click me") });

    await expect
      .element(screen.getByRole("button", { name: "Click me" }))
      .toBeInTheDocument();
  });

  test("passes native attributes through", async () => {
    const screen = await render(Button, {
      children: label("Save"),
      type: "submit",
      disabled: true,
    });

    const button = screen.getByRole("button", { name: "Save" });
    await expect.element(button).toHaveAttribute("type", "submit");
    await expect.element(button).toBeDisabled();
  });

  test("merges class overrides over the defaults", async () => {
    const screen = await render(Button, {
      children: label("Danger"),
      class: "bg-red-700",
    });

    const button = screen.getByRole("button", { name: "Danger" });
    await expect.element(button).toHaveClass(/(?:^|\s)bg-red-700(?:\s|$)/);
    await expect
      .element(button)
      .not.toHaveClass(/(?:^|\s)bg-stone-800(?:\s|$)/);
  });
});
