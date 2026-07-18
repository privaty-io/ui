import { getContext, setContext } from "svelte";
import type { PartialUiConfig, UiConfig } from "./types";

const defaultUiConfig: UiConfig = {
  resolveMessage: (issue) => issue.message,
  labels: {
    form: {
      optional: "(optional)",
      generalError: "Something went wrong. Please try again.",
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
