import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Fixture from "./tile-split.fixture.svelte";

// Renders stay mounted for the whole file in browser tests — every
// query must scope to its own fixture's container.
type Screen = { container: HTMLElement };
const separator = (screen: Screen) =>
  screen.container.querySelector('[role="separator"]') as HTMLElement;

function press(screen: Screen, key: string, shiftKey = false) {
  separator(screen).dispatchEvent(
    new KeyboardEvent("keydown", { key, shiftKey, bubbles: true }),
  );
}

describe("tile split", () => {
  test("exposes the window-splitter ARIA contract", async () => {
    const screen = await render(Fixture, { initial: 200, min: 120, max: 400 });

    const gutter = separator(screen);
    expect(gutter.getAttribute("aria-orientation")).toBe("vertical");
    expect(gutter.getAttribute("aria-label")).toBe("Resize test pane");
    expect(gutter.getAttribute("aria-valuenow")).toBe("200");
    expect(gutter.getAttribute("aria-valuemin")).toBe("120");
    expect(gutter.getAttribute("aria-valuemax")).toBe("400");
    expect(gutter.tabIndex).toBe(0);
  });

  test("collapsible advertises 0 as its minimum", async () => {
    const screen = await render(Fixture, { min: 120, collapsible: true });
    expect(separator(screen).getAttribute("aria-valuemin")).toBe("0");
  });

  test("arrows resize by 16, Shift-arrows by 64, clamped to min/max", async () => {
    const screen = await render(Fixture, {
      initial: 200,
      min: 120,
      max: 260,
    });

    press(screen, "ArrowRight");
    expect(screen.component.currentSize()).toBe(216);
    press(screen, "ArrowLeft");
    expect(screen.component.currentSize()).toBe(200);
    press(screen, "ArrowRight", true);
    expect(screen.component.currentSize()).toBe(260); // 264 clamps to max
    press(screen, "ArrowLeft", true);
    press(screen, "ArrowLeft", true);
    press(screen, "ArrowLeft", true);
    expect(screen.component.currentSize()).toBe(120); // floor at min
  });

  test("with sized='end' the arrows still move the GUTTER, not the pane", async () => {
    const screen = await render(Fixture, {
      sized: "end",
      initial: 200,
      min: 120,
      max: 400,
    });

    // ArrowRight moves the gutter right — the END pane shrinks.
    press(screen, "ArrowRight");
    expect(screen.component.currentSize()).toBe(184);
    press(screen, "ArrowLeft");
    expect(screen.component.currentSize()).toBe(200);
  });

  test("Home goes to min — or collapses to 0 when collapsible", async () => {
    const screen = await render(Fixture, { initial: 200, min: 120 });
    press(screen, "Home");
    expect(screen.component.currentSize()).toBe(120);
    press(screen, "End");
    expect(screen.component.currentSize()).toBe(560);
  });

  test("collapsedSize moves the collapse target: Home lands on the compact width", async () => {
    const screen = await render(Fixture, {
      initial: 200,
      min: 120,
      collapsible: true,
      collapsedSize: 48,
    });

    // The compact width is the advertised minimum…
    expect(separator(screen).getAttribute("aria-valuemin")).toBe("48");

    press(screen, "Home");
    expect(screen.component.currentSize()).toBe(48);
    // …the gutter KEEPS its width (only a full 0-collapse gives it up)…
    expect(separator(screen).className).toContain("w-1.5");
    expect(separator(screen).className).not.toContain("w-0");

    // …shrinking below it stays put, and any grow reopens at min.
    press(screen, "ArrowLeft");
    expect(screen.component.currentSize()).toBe(48);
    press(screen, "ArrowRight");
    expect(screen.component.currentSize()).toBe(120);
  });

  test("collapse and reopen: Home to 0, any grow reopens at min", async () => {
    const screen = await render(Fixture, {
      initial: 200,
      min: 120,
      collapsible: true,
    });

    press(screen, "Home");
    expect(screen.component.currentSize()).toBe(0);
    // (The collapsed gutter's ZERO WIDTH is asserted in the geometry
    // spec — class effects need Tailwind loaded.)

    press(screen, "ArrowRight");
    expect(screen.component.currentSize()).toBe(120);
  });

  test("double-click resets to initial", async () => {
    const screen = await render(Fixture, { initial: 200, min: 120 });
    press(screen, "End");
    expect(screen.component.currentSize()).toBe(560);

    separator(screen).dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true }),
    );
    expect(screen.component.currentSize()).toBe(200);
  });

  // POINTER DRAG is deliberately NOT tested here: synthetically
  // dispatched pointer events don't reach Svelte's handler in this
  // harness (keydown/dblclick dispatches do — verified while writing
  // this file). The e2e tiles spec drives the drag with a REAL mouse,
  // which is the input the gesture exists for anyway.

  test("vertical orientation flips the axis and the aria-orientation", async () => {
    const screen = await render(Fixture, {
      orientation: "vertical",
      initial: 100,
      min: 60,
      max: 200,
    });

    expect(separator(screen).getAttribute("aria-orientation")).toBe(
      "horizontal",
    );
    press(screen, "ArrowDown");
    expect(screen.component.currentSize()).toBe(116);
    press(screen, "ArrowUp");
    expect(screen.component.currentSize()).toBe(100);
  });
});
