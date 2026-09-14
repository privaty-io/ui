import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { layoutsTheme } from "../theme";
import Fixture from "./sidebar-page.fixture.svelte";

// Renders stay mounted for the whole file in browser tests — every
// query must scope to its own fixture's container.
type Screen = { container: HTMLElement };
const tile = (screen: Screen, label: string) =>
  screen.container.querySelector(`section[aria-label="${label}"]`);
const gutter = (screen: Screen) =>
  screen.container.querySelector('[role="separator"]') as HTMLElement;
const currentItem = (screen: Screen) =>
  screen.container.querySelector('a[href="#cellar"]') as HTMLElement;
const labelSpan = (screen: Screen) =>
  [...currentItem(screen).querySelectorAll("span")].find((span) =>
    span.textContent?.includes("Cellar"),
  ) as HTMLElement;

describe("sidebar page", () => {
  test("nav and main render as labeled tiles around the gutter; compact is the advertised minimum", async () => {
    const screen = await render(Fixture, {});

    expect(tile(screen, "Navigation")).not.toBeNull();
    expect(tile(screen, "Workbench")).not.toBeNull();
    expect(gutter(screen).getAttribute("aria-label")).toBe("Resize navigation");
    // The collapse target is the compact rail, not 0.
    expect(gutter(screen).getAttribute("aria-valuemin")).toBe("48");
  });

  test("collapsing goes COMPACT: labels turn sr-only, items center, the footer hides", async () => {
    const screen = await render(Fixture, {});
    const toggle = screen.getByTestId("toggle-nav");

    // Open: full labels, footer visible.
    expect(labelSpan(screen).className).not.toContain("sr-only");
    await expect.element(screen.getByTestId("nav-footer")).toBeInTheDocument();

    await toggle.click();
    expect(screen.component.currentNavSize()).toBe(48);
    // The context flows into the snippet…
    await expect.element(toggle).toHaveTextContent("open nav");
    // …and into the nav pieces: icon-only items, accessible names kept.
    await expect.element(screen.getByTestId("cellar-icon")).toBeVisible();
    expect(labelSpan(screen).className).toContain("sr-only");
    for (const cls of layoutsTheme.nav.itemCompact.split(" ")) {
      expect(currentItem(screen).className).toContain(cls);
    }
    expect(
      screen.container.querySelector('[data-testid="nav-footer"]'),
    ).toBeNull();

    await toggle.click();
    expect(screen.component.currentNavSize()).toBe(240);
    expect(labelSpan(screen).className).not.toContain("sr-only");
  });

  test("the toggle restores the LAST open width, and works from the instance too", async () => {
    const screen = await render(Fixture, {});

    // Tune via the gutter's keyboard contract first…
    gutter(screen).dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(screen.component.currentNavSize()).toBe(256);

    // …then collapse and reopen through the exported instance method
    // (a toggle button living outside the scaffold).
    screen.component.toggleFromOutside();
    expect(screen.component.currentNavSize()).toBe(48);
    screen.component.toggleFromOutside();
    expect(screen.component.currentNavSize()).toBe(256);
  });

  test("bare hands over the main track — no wrapping tile", async () => {
    const screen = await render(Fixture, { bare: true });

    expect(tile(screen, "Workbench")).toBeNull();
    await expect
      .element(screen.getByTestId("main-content"))
      .toBeInTheDocument();
  });
});
