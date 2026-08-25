import { describe, expect, test } from "vitest";

import { defaultUiConfig, mergeUiConfig } from "./context";

function issue(message: string) {
  return { message };
}

describe("defaultUiConfig", () => {
  test("resolves messages verbatim", () => {
    expect(defaultUiConfig.resolveMessage(issue("required"))).toBe("required");
  });

  test("provides english labels grouped by package", () => {
    expect(defaultUiConfig.labels).toEqual({
      form: {
        optional: "(optional)",
        generalError: "Something went wrong. Please try again.",
        submit: "Submit",
        reset: "Reset",
      },
      table: {
        actions: "Actions",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        add: "Add",
        cancel: "Cancel",
        empty: "No rows",
        expand: "Expand row",
      },
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

  test("merges partial form labels instead of replacing them", () => {
    const merged = mergeUiConfig(defaultUiConfig, {
      labels: { form: { optional: "(valgfri)" } },
    });

    expect(merged.labels.form.optional).toBe("(valgfri)");
    expect(merged.labels.form.generalError).toBe(
      defaultUiConfig.labels.form.generalError,
    );
  });

  test("merges partial table labels instead of replacing them", () => {
    const merged = mergeUiConfig(defaultUiConfig, {
      labels: { table: { edit: "Rediger" } },
    });

    expect(merged.labels.table.edit).toBe("Rediger");
    expect(merged.labels.table.cancel).toBe(
      defaultUiConfig.labels.table.cancel,
    );
    expect(merged.labels.form).toEqual(defaultUiConfig.labels.form);
  });

  test("inherits customizations from a non-default base", () => {
    const base = mergeUiConfig(defaultUiConfig, {
      resolveMessage: () => "from base",
      labels: { form: { optional: "(base)" } },
    });

    const merged = mergeUiConfig(base, {
      labels: { form: { generalError: "from override" } },
    });

    expect(merged.resolveMessage(issue("anything"))).toBe("from base");
    expect(merged.labels).toEqual({
      form: {
        optional: "(base)",
        generalError: "from override",
        submit: "Submit",
        reset: "Reset",
      },
      table: defaultUiConfig.labels.table,
    });
  });

  test("does not mutate the base config", () => {
    const base = mergeUiConfig(defaultUiConfig, {});

    mergeUiConfig(base, { labels: { form: { optional: "(changed)" } } });

    expect(base.labels.form.optional).toBe(
      defaultUiConfig.labels.form.optional,
    );
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
