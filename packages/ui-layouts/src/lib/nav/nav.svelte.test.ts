import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { layoutsTheme } from "../theme";
import Fixture from "./nav.fixture.svelte";

describe("nav list + items", () => {
  test("a labeled <nav> landmark with the footer docked below the items", async () => {
    const screen = await render(Fixture, {});

    const nav = screen.container.querySelector('nav[aria-label="Fixture nav"]');
    expect(nav).not.toBeNull();
    // The footer sits OUTSIDE the scrolling items stack, as its sibling.
    const footer = nav?.lastElementChild;
    expect(footer?.textContent).toBe("v0-fixture");
    expect(footer?.contains(nav!.querySelector("a"))).toBe(false);
  });

  test("href renders a Link; current gets the wash and aria-current", async () => {
    const screen = await render(Fixture, {});

    const current = screen.container.querySelector(
      'a[href="#cellar"]',
    ) as HTMLElement;
    expect(current.getAttribute("aria-current")).toBe("page");
    for (const cls of layoutsTheme.nav.itemCurrent.split(" ")) {
      expect(current.className).toContain(cls);
    }

    const other = screen.container.querySelector(
      'a[href="#orders"]',
    ) as HTMLElement;
    expect(other.getAttribute("aria-current")).toBeNull();
    expect(other.className).not.toContain("font-medium");
  });

  test("no href renders a non-submitting Button that fires onclick", async () => {
    const screen = await render(Fixture, {});

    const button = screen.container.querySelector("button") as HTMLElement;
    expect(button.getAttribute("type")).toBe("button");
    await screen.getByRole("button", { name: "Act" }).click();
    expect(screen.component.activations()).toBe(1);
  });

  test("outside a compact provider, labels stay visible", async () => {
    const screen = await render(Fixture, {});

    const spans = screen.container.querySelectorAll('a[href="#cellar"] span');
    for (const span of spans) {
      expect(span.className).not.toContain("sr-only");
    }
  });
});

describe("header nav", () => {
  test("a horizontal landmark carrying the same items", async () => {
    const screen = await render(Fixture, {});

    const nav = screen.container.querySelector(
      'nav[aria-label="Fixture top nav"]',
    ) as HTMLElement;
    for (const cls of layoutsTheme.nav.headerNav.split(" ")) {
      expect(nav.className).toContain(cls);
    }
    const home = nav.querySelector('a[href="#home"]');
    expect(home?.getAttribute("aria-current")).toBe("page");
  });
});
