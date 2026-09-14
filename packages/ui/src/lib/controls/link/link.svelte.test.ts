import { createRawSnippet } from "svelte";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Link from "./link.svelte";

function label(text: string) {
  return createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));
}

describe("link", () => {
  test("renders an anchor with its href and children", async () => {
    const screen = await render(Link, {
      href: "/docs",
      children: label("Docs"),
    });

    const link = screen.getByRole("link", { name: "Docs" });
    await expect.element(link).toBeInTheDocument();
    await expect.element(link).toHaveAttribute("href", "/docs");
  });

  test("defaults to the text variant — underlined, blending into copy", async () => {
    const screen = await render(Link, {
      href: "#",
      children: label("Read more"),
    });

    await expect.element(screen.getByRole("link")).toHaveClass(/underline/);
  });

  test("button-shaped variants share the Button skin exactly", async () => {
    const screen = await render(Link, {
      href: "#",
      variant: "primary",
      children: label("Get started"),
    });

    // The same theme token Button's primary uses.
    await expect.element(screen.getByRole("link")).toHaveClass(/bg-stone-800/);
  });

  test("native anchor attributes pass through", async () => {
    // `target` is a Svelte MOUNT option — component props must nest
    // under `props` whenever one shares a name with an option.
    const screen = await render(Link, {
      props: {
        href: "https://example.com",
        target: "_blank",
        rel: "noreferrer",
        children: label("External"),
      },
    });

    const link = screen.getByRole("link", { name: "External" });
    await expect.element(link).toHaveAttribute("target", "_blank");
    await expect.element(link).toHaveAttribute("rel", "noreferrer");
  });
});
