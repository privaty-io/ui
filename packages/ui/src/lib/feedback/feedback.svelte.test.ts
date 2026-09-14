import { createRawSnippet } from "svelte";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Badge from "./badge/badge.svelte";
import Skeleton from "./skeleton/skeleton.svelte";

const label = (text: string) =>
  createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe("badge", () => {
  test("neutral by default; the text carries the meaning", async () => {
    const screen = await render(Badge, { children: label("3 pending") });
    const badge = screen.container.querySelector("span");
    expect(badge?.textContent).toBe("3 pending");
    expect(badge?.className).toContain("bg-stone-200/70");
  });

  test("each tone maps to its muted surface", async () => {
    for (const [tone, expected] of [
      ["positive", "emerald"],
      ["warning", "amber"],
      ["critical", "red"],
    ] as const) {
      const screen = await render(Badge, {
        tone,
        children: label(tone),
      });
      const badge = [...screen.container.querySelectorAll("span")].find(
        (el) => el.textContent === tone,
      );
      expect(badge?.className, tone).toContain(expected);
    }
  });
});

describe("skeleton", () => {
  test("a single block, hidden from assistive tech", async () => {
    const screen = await render(Skeleton, { class: "h-24" });
    const block = screen.container.querySelector('[aria-hidden="true"]');
    expect(block).not.toBeNull();
    expect(block?.className).toContain("animate-pulse");
    expect(block?.className).toContain("motion-reduce:animate-none");
  });

  test("lines render a stack with a ragged last line", async () => {
    const screen = await render(Skeleton, { lines: 3 });
    const wrapper = screen.container.querySelector('[aria-hidden="true"]');
    const bars = wrapper?.querySelectorAll("div") ?? [];
    expect(bars.length).toBe(3);
    expect(bars[0].className).toContain("w-full");
    expect(bars[2].className).toContain("w-3/5");
  });
});
