import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { coreTheme } from "../theme";
import Fixture from "./tiles.fixture.svelte";

describe("tile family", () => {
  test("tiles are labeled section landmarks on a canvas", async () => {
    const screen = await render(Fixture, {});

    const tile = screen.container.querySelector('[data-testid="interactive"]');
    expect(tile?.tagName).toBe("SECTION");
    expect(tile?.getAttribute("aria-label")).toBe("Interactive");

    const canvas = screen.container.querySelector('[data-testid="canvas"]');
    expect(canvas?.className).toContain("gap-1.5");
  });

  test("interactive tiles carry the state cues; still tiles opt out", async () => {
    const screen = await render(Fixture, {});

    const interactive = screen.container.querySelector(
      '[data-testid="interactive"]',
    ) as HTMLElement;
    const still = screen.container.querySelector(
      '[data-testid="static"]',
    ) as HTMLElement;

    expect(interactive.className).toContain("focus-within:");
    expect(still.className).not.toContain("focus-within:");
  });

  test("flush drops the default padding", async () => {
    const screen = await render(Fixture, {});

    const flush = screen.container.querySelector(
      '[data-testid="flush"]',
    ) as HTMLElement;
    const padded = screen.container.querySelector(
      '[data-testid="interactive"]',
    ) as HTMLElement;

    // Against the token, not a literal — the padding is a tuning knob.
    expect(padded.className).toContain(coreTheme.tiles.tilePadding);
    expect(flush.className).not.toContain(coreTheme.tiles.tilePadding);
  });

  test("TileTitle renders an h2 and docks the actions snippet", async () => {
    const screen = await render(Fixture, {});

    const heading = screen.container.querySelector(
      '[data-testid="interactive"] h2',
    );
    expect(heading?.textContent).toBe("Interactive");
    await expect
      .element(screen.getByTestId("title-action"))
      .toBeInTheDocument();
  });
});
