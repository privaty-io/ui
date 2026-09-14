import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

// Geometry assertions need the real classes applied.
import "../testing/tailwind.css";

import SplitFixture from "./tile-split/tile-split.fixture.svelte";

const separator = (screen: { container: HTMLElement }) =>
  screen.container.querySelector('[role="separator"]') as HTMLElement;

describe("tile split geometry", () => {
  test("the handle sits centered in the gutter — BOTH orientations", async () => {
    // Regression: margin-auto only centers on the inline axis, so the
    // vertical split's handle sat pressed against the pane above.
    for (const orientation of ["horizontal", "vertical"] as const) {
      const screen = await render(SplitFixture, { orientation });
      const gutter = separator(screen);
      const handle = gutter.lastElementChild as HTMLElement;

      const gutterBox = gutter.getBoundingClientRect();
      const handleBox = handle.getBoundingClientRect();
      const axis = orientation === "horizontal" ? "x" : "y";
      const gutterCenter =
        axis === "x"
          ? gutterBox.left + gutterBox.width / 2
          : gutterBox.top + gutterBox.height / 2;
      const handleCenter =
        axis === "x"
          ? handleBox.left + handleBox.width / 2
          : handleBox.top + handleBox.height / 2;
      expect(
        Math.abs(gutterCenter - handleCenter),
        `${orientation} handle centered`,
      ).toBeLessThan(1);
    }
  });

  test("collapsing gives up the gutter's own width — no double edge inset", async () => {
    const screen = await render(SplitFixture, {
      initial: 200,
      min: 120,
      collapsible: true,
    });

    const gutter = separator(screen);
    expect(gutter.getBoundingClientRect().width).toBeCloseTo(6, 0);

    gutter.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
    await expect
      .poll(() => gutter.getBoundingClientRect().width)
      .toBeLessThan(1);
    // Still focusable and reopenable from the edge.
    gutter.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    await expect
      .poll(() => gutter.getBoundingClientRect().width)
      .toBeCloseTo(6, 0);
  });
});
