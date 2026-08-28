import { getContext, setContext } from "svelte";
import type { PartialUiConfig, UiConfig } from "./types";

/**
 * Built-in English defaults — the config every component sees when no
 * ancestor called setUiConfig. Its resolveMessage returns the validation
 * issue's own message unchanged.
 */
const defaultUiConfig: UiConfig = {
  resolveMessage: (issue) => issue.message,
  labels: {
    form: {
      optional: "(optional)",
      required: "*",
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
  },
};

const uiConfigContextKey = Symbol("privaty-ui-config");

/**
 * Merges partial overrides over a full base config. Top-level keys are
 * shallow-merged; the form and table label groups are each merged per key, so
 * an override can replace single labels without repeating the rest.
 */
function mergeUiConfig(base: UiConfig, overrides: PartialUiConfig): UiConfig {
  return {
    ...base,
    ...overrides,
    labels: {
      form: { ...base.labels.form, ...overrides.labels?.form },
      table: { ...base.labels.table, ...overrides.labels?.table },
    },
  };
}

/**
 * Provides a UI config to the component's subtree via Svelte context. The
 * overrides are merged over the nearest ambient config (or the defaults), so
 * nested calls layer — a subtree can override a handful of labels and inherit
 * everything else. The merge runs once at call time; must be called during
 * component init.
 */
function setUiConfig(config: PartialUiConfig): void {
  setContext<UiConfig>(
    uiConfigContextKey,
    mergeUiConfig(getUiConfig(), config),
  );
}

/**
 * Reads the nearest config provided by setUiConfig, falling back to the
 * built-in defaults. Must be called during component init. The result is a
 * plain merged snapshot, not a reactive object.
 */
function getUiConfig(): UiConfig {
  return (
    getContext<UiConfig | undefined>(uiConfigContextKey) ?? defaultUiConfig
  );
}

export { defaultUiConfig, getUiConfig, mergeUiConfig, setUiConfig };
