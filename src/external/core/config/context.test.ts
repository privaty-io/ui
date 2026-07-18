import { describe, expect, test } from "vitest";

import { defaultUiConfig, mergeUiConfig } from "./context";

function issue(message: string) {
  return { message };
}

describe("defaultUiConfig", () => {
  test("resolves messages verbatim", () => {
    expect(defaultUiConfig.resolveMessage(issue("required"))).toBe("required");
  });

  test("provides english labels", () => {
    expect(defaultUiConfig.labels).toEqual({
      optional: "(optional)",
      generalError: "Something went wrong. Please try again.",
    });
  });
});

describe("mergeUiConfig", () => {
  test("returns an equivalent config when no overrides are given", () => {
    expect(mergeUiConfig(defaultUiConfig, {})).toEqual(defaultUiConfig);
  });

  test("overrides win over the base", () => {
    const resolveMessage = () => "translated";

    const merged = mergeUiConfig(defaultUiConfig, { resolveMessage });

    expect(merged.resolveMessage).toBe(resolveMessage);
  });

  test("keeps base fields that are not overridden", () => {
    const merged = mergeUiConfig(defaultUiConfig, { resolveMessage: () => "" });

    expect(merged.labels).toEqual(defaultUiConfig.labels);
  });

  test("merges partial labels instead of replacing them", () => {
    const merged = mergeUiConfig(defaultUiConfig, {
      labels: { optional: "(valgfri)" },
    });

    expect(merged.labels.optional).toBe("(valgfri)");
    expect(merged.labels.generalError).toBe(
      defaultUiConfig.labels.generalError,
    );
  });

  test("inherits customizations from a non-default base", () => {
    const base = mergeUiConfig(defaultUiConfig, {
      resolveMessage: () => "from base",
      labels: { optional: "(base)" },
    });

    const merged = mergeUiConfig(base, {
      labels: { generalError: "from override" },
    });

    expect(merged.resolveMessage(issue("anything"))).toBe("from base");
    expect(merged.labels).toEqual({
      optional: "(base)",
      generalError: "from override",
    });
  });

  test("does not mutate the base config", () => {
    const base = mergeUiConfig(defaultUiConfig, {});

    mergeUiConfig(base, { labels: { optional: "(changed)" } });

    expect(base.labels.optional).toBe(defaultUiConfig.labels.optional);
  });

  test("supports the code-based translation pattern", () => {
    const validatorMessage: Record<string, string> = {
      required: "Feltet skal udfyldes.",
      "too-short": "Værdien er for kort.",
    };

    const config = mergeUiConfig(defaultUiConfig, {
      resolveMessage: (i) => validatorMessage[i.message] ?? i.message,
    });

    expect(config.resolveMessage(issue("required"))).toBe(
      "Feltet skal udfyldes.",
    );
    expect(config.resolveMessage(issue("A plain english message."))).toBe(
      "A plain english message.",
    );
  });
});
