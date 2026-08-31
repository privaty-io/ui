import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import Fixture from "./position.fixture.svelte";

function rects(container: HTMLElement) {
  const anchor = container
    .querySelector('[data-testid="anchor"]')!
    .getBoundingClientRect();
  const floating = document
    .querySelector('[data-testid="floating"]')!
    .getBoundingClientRect();
  return { anchor, floating };
}

describe("anchorTo", () => {
  test("places the element against the anchor with the requested placement", async () => {
    const screen = await render(Fixture, {
      options: { placement: "bottom-start", offset: 8 },
    });

    const { anchor, floating } = rects(screen.container);
    expect(floating.top).toBeCloseTo(anchor.bottom + 8, 0);
    expect(floating.left).toBeCloseTo(anchor.left, 0);

    const element = document.querySelector('[data-testid="floating"]')!;
    expect(element.getAttribute("data-placement")).toBe("bottom-start");
  });

  test("tracks the anchor through ancestor scrolling", async () => {
    const screen = await render(Fixture, {
      options: { placement: "bottom-start" },
    });

    const before = rects(screen.container);
    expect(before.floating.top).toBeCloseTo(before.anchor.bottom, 0);

    const scroller = screen.container.querySelector(
      '[data-testid="scroller"]',
    )!;
    scroller.scrollTop = 120;

    // Scroll events dispatch async — wait for the reposition.
    await vi.waitFor(() => {
      const after = rects(screen.container);
      expect(after.anchor.bottom).toBeCloseTo(before.anchor.bottom - 120, 0);
      expect(after.floating.top).toBeCloseTo(after.anchor.bottom, 0);
    });
  });

  test("repositions when the element's own size changes", async () => {
    const screen = await render(Fixture, {
      options: { placement: "top-start" },
    });

    const before = rects(screen.container);
    expect(before.floating.bottom).toBeCloseTo(before.anchor.top, 0);

    // Growing a top-placed element must push its top edge further up.
    const element = document.querySelector<HTMLElement>(
      '[data-testid="floating"]',
    )!;
    element.style.height = "100px";

    await vi.waitFor(() => {
      const after = rects(screen.container);
      expect(after.floating.height).toBeCloseTo(100, 0);
      expect(after.floating.bottom).toBeCloseTo(after.anchor.top, 0);
    });
  });

  test("overrides the [popover] UA styles to take viewport coordinates", async () => {
    const screen = await render(Fixture, {
      asPopover: true,
      options: { placement: "bottom-start", offset: 4 },
    });

    const element = document.querySelector<HTMLElement>(
      '[data-testid="floating"]',
    )!;
    element.showPopover();

    // The UA's `inset: 0; margin: auto` would stretch/center the popover —
    // the attachment must pin it to the computed spot at natural size, once
    // the resize observer notices it became visible.
    await vi.waitFor(() => {
      const { anchor, floating } = rects(screen.container);
      expect(floating.width).toBeCloseTo(120, 0);
      expect(floating.top).toBeCloseTo(anchor.bottom + 4, 0);
      expect(floating.left).toBeCloseTo(anchor.left, 0);
    });
  });

  test("a hidden element positions itself once it becomes visible", async () => {
    const screen = await render(Fixture, {
      options: { placement: "bottom-start" },
    });

    const element = document.querySelector<HTMLElement>(
      '[data-testid="floating"]',
    )!;
    element.style.display = "none";
    element.style.display = "";

    await vi.waitFor(() => {
      const { anchor, floating } = rects(screen.container);
      expect(floating.top).toBeCloseTo(anchor.bottom, 0);
    });
  });
});
