import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Input from "./input.svelte";
import Select from "./select.svelte";
import "../testing/tailwind.css";

// This stylesheet loads Tailwind WITHOUT `@tailwindcss/forms` — proving the
// controls carry their own chrome. Published packages land in apps that
// don't have the plugin; these computed-style guards fail if a control
// starts leaning on it again.
describe("plugin-free control chrome", () => {
  test("inputs carry their own border", async () => {
    const screen = await render(Input, { label: "Name" });

    const input = screen.getByLabelText("Name").element() as HTMLElement;
    const style = getComputedStyle(input);

    expect(style.borderTopWidth).toBe("1px");
    expect(style.borderTopStyle).toBe("solid");
    expect(style.appearance).toBe("none");
    // Controls declare their own color-scheme: the browser paints native
    // widget parts (select popups, spinners) from it — a host app that
    // never sets one would otherwise get light popups under dark text.
    expect(style.colorScheme).toBe("light");
  });

  test("focus shows the library ring, not the UA lottery", async () => {
    const screen = await render(Input, { label: "Name" });

    const input = screen.getByLabelText("Name").element() as HTMLElement;
    // Inputs match :focus-visible whenever focused (they take keyboard
    // input), so programmatic focus deterministically shows the ring.
    input.focus();
    const style = getComputedStyle(input);

    // The custom outline replaces the native ring — which is near-invisible
    // in Chromium/Edge against this palette and different in every engine.
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("1px");
  });

  test("selects carry their own chevron", async () => {
    const screen = await render(Select, {
      label: "Category",
      options: ["cheese", "wine"],
    });

    const select = screen.getByLabelText("Category").element() as HTMLElement;
    const style = getComputedStyle(select);

    // appearance-none removes the native arrow; the overlaid lucide icon
    // replaces it and must never intercept clicks.
    expect(style.appearance).toBe("none");
    expect(Number.parseFloat(style.paddingRight)).toBeGreaterThan(20);

    const chevron = select.parentElement?.querySelector("svg");
    expect(chevron).not.toBeNull();
    expect(getComputedStyle(chevron as SVGElement).pointerEvents).toBe("none");
  });
});
