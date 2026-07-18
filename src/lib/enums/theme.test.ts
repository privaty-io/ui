import { describe, expect, test } from "vitest";

import { parseTheme, Theme } from "./theme";

describe("parseTheme", () => {
  test.each([
    ["system", Theme.System],
    ["light", Theme.Light],
    ["dark", Theme.Dark],
  ])("accepts %s", (value, expected) => {
    expect(parseTheme(value)).toBe(expected);
  });

  test.each([undefined, null, "", "blue", '"><script>alert(1)</script>'])(
    "falls back to system for %o",
    (value) => {
      expect(parseTheme(value)).toBe(Theme.System);
    },
  );
});
