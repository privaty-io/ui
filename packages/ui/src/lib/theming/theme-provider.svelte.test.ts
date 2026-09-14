import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import { theme } from "./theme.svelte";
import Fixture from "./theming.fixture.svelte";

const root = () => document.documentElement;

describe("theme provider + toggle", () => {
  beforeEach(() => {
    // The suite shares one document — reset the world each test.
    theme.preference = "system";
    delete root().dataset.theme;
    delete root().dataset.themePreference;
    document.cookie = "theme-preference=; Path=/; Max-Age=0";
  });

  test("applies the resolved scheme and preference to <html>", async () => {
    await render(Fixture, {});

    await vi.waitFor(() => {
      expect(root().dataset.themePreference).toBe("system");
      // "system" resolves to the test browser's OS preference — a real
      // scheme either way, never left unset.
      expect(["light", "dark"]).toContain(root().dataset.theme);
    });
  });

  test("the toggle cycles system → light → dark and the document follows", async () => {
    const screen = await render(Fixture, {});
    const toggle = screen.getByRole("button", { name: "Switch theme" });

    await toggle.click();
    await vi.waitFor(() => {
      expect(theme.preference).toBe("light");
      expect(root().dataset.theme).toBe("light");
      expect(root().dataset.themePreference).toBe("light");
    });
    // Explicit preferences persist to the cookie (localhost counts as a
    // secure context, so the Secure cookie sticks).
    expect(document.cookie).toContain("theme-preference=light");

    await toggle.click();
    await vi.waitFor(() => {
      expect(root().dataset.theme).toBe("dark");
      expect(root().dataset.themePreference).toBe("dark");
    });

    // Full circle — and "system" clears the cookie (absence IS system).
    await toggle.click();
    await vi.waitFor(() => {
      expect(theme.preference).toBe("system");
      expect(root().dataset.themePreference).toBe("system");
    });
    expect(document.cookie).not.toContain("theme-preference=");
  });

  test("setting the store directly drives the document too", async () => {
    await render(Fixture, {});

    theme.preference = "dark";
    await vi.waitFor(() => {
      expect(root().dataset.theme).toBe("dark");
    });
  });
});
