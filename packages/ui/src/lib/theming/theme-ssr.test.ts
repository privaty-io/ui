import { describe, expect, test } from "vitest";

import { parseThemePreference } from "./theme.svelte";
import { themeHtmlAttributes, themeInitScript } from "./theme-ssr";

describe("parseThemePreference", () => {
  test("accepts exactly light and dark; everything else is system", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("system")).toBe("system");
    expect(parseThemePreference("DARK")).toBe("system");
    expect(parseThemePreference("")).toBe("system");
    expect(parseThemePreference(undefined)).toBe("system");
    expect(parseThemePreference(null)).toBe("system");
  });
});

describe("themeHtmlAttributes", () => {
  test("explicit preferences carry the scheme AND the preference", () => {
    expect(themeHtmlAttributes("dark")).toBe(
      'data-theme="dark" data-theme-preference="dark"',
    );
    expect(themeHtmlAttributes("light")).toBe(
      'data-theme="light" data-theme-preference="light"',
    );
  });

  test("system carries only the preference — the media query owns the scheme", () => {
    expect(themeHtmlAttributes("system")).toBe(
      'data-theme-preference="system"',
    );
  });
});

describe("themeInitScript", () => {
  test("embeds the cookie name and the no-op guard", () => {
    const script = themeInitScript();
    expect(script).toContain('"theme-preference="');
    expect(script).toContain("if(!document.documentElement.dataset.theme)");
    expect(script).toContain("prefers-color-scheme: dark");
    expect(script).toContain("document.currentScript.remove()");
  });

  test("a custom cookie name lands in the source, safely quoted", () => {
    expect(themeInitScript("my-theme")).toContain('"my-theme="');
  });
});
