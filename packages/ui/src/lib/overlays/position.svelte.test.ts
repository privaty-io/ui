import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import { anchorTo } from "./position";
import Fixture from "./position.fixture.svelte";

// The same detect the module uses. The geometry suite runs against BOTH
// engines via the `engine` seam: where anchor positioning is supported the
// JS engine is otherwise unreachable — yet it is the only engine older
// browsers get, so its DOM branch (listeners, ResizeObserver, UA
// overrides) must not rot unseen. The native run needs browser support.
const nativeAnchor =
  CSS.supports("anchor-name", "--a") && CSS.supports("position-area", "bottom");

function rects(container: HTMLElement) {
  const anchor = container
    .querySelector('[data-testid="anchor"]')!
    .getBoundingClientRect();
  const floating = document
    .querySelector('[data-testid="floating"]')!
    .getBoundingClientRect();
  return { anchor, floating };
}

for (const engine of ["native", "js"] as const) {
  describe.skipIf(engine === "native" && !nativeAnchor)(
    `anchorTo (${engine} engine)`,
    () => {
      test("places the element against the anchor with the requested placement", async () => {
        const screen = await render(Fixture, {
          options: { engine, placement: "bottom-start", offset: 8 },
        });

        const { anchor, floating } = rects(screen.container);
        expect(floating.top).toBeCloseTo(anchor.bottom + 8, 0);
        expect(floating.left).toBeCloseTo(anchor.left, 0);

        const element = document.querySelector('[data-testid="floating"]')!;
        expect(element.getAttribute("data-placement")).toBe("bottom-start");
      });

      test("tracks the anchor through ancestor scrolling", async () => {
        const screen = await render(Fixture, {
          options: { engine, placement: "bottom-start" },
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
          expect(after.anchor.bottom).toBeCloseTo(
            before.anchor.bottom - 120,
            0,
          );
          expect(after.floating.top).toBeCloseTo(after.anchor.bottom, 0);
        });
      });

      test("repositions when the element's own size changes", async () => {
        const screen = await render(Fixture, {
          options: { engine, placement: "top-start" },
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
          options: { engine, placement: "bottom-start", offset: 4 },
        });

        const element = document.querySelector<HTMLElement>(
          '[data-testid="floating"]',
        )!;
        element.showPopover();

        // The UA's `inset: 0; margin: auto` would stretch/center the
        // popover — the attachment must pin it to the computed spot at
        // natural size, once it notices the element became visible.
        await vi.waitFor(() => {
          const { anchor, floating } = rects(screen.container);
          expect(floating.width).toBeCloseTo(120, 0);
          expect(floating.top).toBeCloseTo(anchor.bottom + 4, 0);
          expect(floating.left).toBeCloseTo(anchor.left, 0);
        });
      });

      test("a hidden element positions itself once it becomes visible", async () => {
        const screen = await render(Fixture, {
          options: { engine, placement: "bottom-start" },
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
    },
  );
}

// Native-engine style bookkeeping — inline styles that only exist where
// CSS anchor positioning does.
describe.runIf(nativeAnchor)("anchorTo native bookkeeping", () => {
  test("turning flip off clears the previous run's fallback", async () => {
    const screen = await render(Fixture, {
      options: { placement: "bottom", flip: true },
    });

    const element = document.querySelector<HTMLElement>(
      '[data-testid="floating"]',
    )!;
    expect(element.style.getPropertyValue("position-try-fallbacks")).toBe(
      "flip-block",
    );

    // The attachment re-creates on the SAME element when options change —
    // a stale fallback would keep flipping despite flip: false.
    await screen.rerender({ options: { placement: "bottom", flip: false } });
    await vi.waitFor(() => {
      expect(element.style.getPropertyValue("position-try-fallbacks")).toBe("");
    });
  });

  test("two attachments share one anchor without clobbering each other", async () => {
    const anchor = document.createElement("button");
    const first = document.createElement("div");
    const second = document.createElement("div");
    document.body.append(anchor, first, second);

    const cleanupFirst = anchorTo(anchor, { placement: "bottom" })(first);
    const cleanupSecond = anchorTo(anchor, { placement: "top" })(second);

    // anchor-name is a comma-separated list — both stay registered.
    const names = anchor.style
      .getPropertyValue("anchor-name")
      .split(",")
      .map((entry) => entry.trim());
    expect(names).toContain(first.style.getPropertyValue("position-anchor"));
    expect(names).toContain(second.style.getPropertyValue("position-anchor"));

    // Out-of-order cleanup: destroying the FIRST must leave the still-
    // mounted second attachment's name in place.
    (cleanupFirst as () => void)();
    expect(anchor.style.getPropertyValue("anchor-name").trim()).toBe(
      second.style.getPropertyValue("position-anchor"),
    );

    (cleanupSecond as () => void)();
    expect(anchor.style.getPropertyValue("anchor-name")).toBe("");

    anchor.remove();
    first.remove();
    second.remove();
  });
});
