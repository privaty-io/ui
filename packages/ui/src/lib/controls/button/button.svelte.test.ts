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

  test("ghost and text variants render transparent, distinctly styled", async () => {
    const ghost = await render(Button, {
      variant: "ghost",
      children: label("Ghost"),
    });
    // Both renders stay mounted in one browser test — scope by name.
    await expect
      .element(ghost.getByRole("button", { name: "Ghost" }))
      .toHaveClass(/bg-transparent/);

    const text = await render(Button, {
      variant: "text",
      children: label("Text"),
    });
    await expect
      .element(text.getByRole("button", { name: "Text" }))
      .toHaveClass(/underline/);
  });

  test("renders the secondary variant without the primary background", async () => {
    const screen = await render(Button, {
      children: label("Cancel"),
      variant: "secondary",
    });

    const button = screen.getByRole("button", { name: "Cancel" });
    await expect.element(button).toHaveClass(/(?:^|\s)border(?:\s|$)/);
    await expect
      .element(button)
      .not.toHaveClass(/(?:^|\s)bg-stone-800(?:\s|$)/);
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
