import { describe, expect, test } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  test("joins classes and drops falsy values", () => {
    expect(cn("a", false, undefined, "c")).toBe("a c");
  });

  test("resolves tailwind conflicts with last-wins", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  test("supports object and array inputs", () => {
    expect(cn(["a", { b: true, c: false }])).toBe("a b");
  });
});
