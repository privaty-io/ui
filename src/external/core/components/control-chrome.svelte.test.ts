import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Input from "./input.svelte";
import Select from "./select.svelte";
import "../testing/tailwind.css";

// This stylesheet loads Tailwind WITHOUT @tailwindcss/forms — proving the
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
