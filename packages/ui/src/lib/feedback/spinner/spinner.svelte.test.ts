import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Spinner from "./spinner.svelte";

describe("spinner", () => {
  test("renders a decorative spinning icon", async () => {
    const screen = await render(Spinner, {});

    const svg = screen.container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.classList.contains("animate-spin")).toBe(true);
  });

  test("merges class overrides over the defaults", async () => {
    const screen = await render(Spinner, { class: "size-6" });

    const svg = screen.container.querySelector("svg");
    expect(svg?.classList.contains("size-6")).toBe(true);
    expect(svg?.classList.contains("size-4")).toBe(false);
  });
});
