import { getContext, setContext } from "svelte";
import type { PartialUiConfig, UiConfig } from "./types";

const defaultUiConfig: UiConfig = {
  resolveMessage: (issue) => issue.message,
  labels: {
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
  },
};

const uiConfigContextKey = Symbol("privaty-ui-config");

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

function setUiConfig(config: PartialUiConfig): void {
  setContext<UiConfig>(
    uiConfigContextKey,
    mergeUiConfig(getUiConfig(), config),
  );
}

function getUiConfig(): UiConfig {
  return (
    getContext<UiConfig | undefined>(uiConfigContextKey) ?? defaultUiConfig
  );
}

export { defaultUiConfig, getUiConfig, mergeUiConfig, setUiConfig };
