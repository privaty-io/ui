import { createRawSnippet } from "svelte";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Divider from "./divider/divider.svelte";
import Kbd from "./kbd/kbd.svelte";

const label = (text: string) =>
  createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe("divider", () => {
  test("plain form: a full-width separator line", async () => {
    const screen = await render(Divider, {});
    const divider = screen.container.querySelector('[role="separator"]');
    expect(divider).not.toBeNull();
    expect(divider?.className).toContain("h-px");
  });

  test("labeled form centers the text between two lines", async () => {
    const screen = await render(Divider, { label: "Optional details" });
    const divider = screen.container.querySelector('[role="separator"]');
    expect(divider?.textContent?.trim()).toBe("Optional details");
    expect(divider?.querySelectorAll("span.h-px").length).toBe(2);
  });

  test("vertical form self-stretches with the right orientation", async () => {
    const screen = await render(Divider, { vertical: true });
    const divider = screen.container.querySelector('[role="separator"]');
    expect(divider?.getAttribute("aria-orientation")).toBe("vertical");
    expect(divider?.className).toContain("w-px");
  });
});

describe("kbd", () => {
  test("renders a real <kbd> element with its content", async () => {
    const screen = await render(Kbd, { children: label("Home") });
    const kbd = screen.container.querySelector("kbd");
    expect(kbd).not.toBeNull();
    expect(kbd?.textContent).toBe("Home");
  });
});
