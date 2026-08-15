import type { StandardSchemaV1 } from "@standard-schema/spec";

type MessageResolver = (issue: StandardSchemaV1.Issue) => string;

interface UiFormLabels {
  optional: string; // the "(optional)" minority marker
  generalError: string; // fallback when a submit throws

  submit: string; // default Submit button label
  reset: string; // default Reset button label
}

interface UiLabels {
  form: UiFormLabels;
}

interface UiConfig {
  resolveMessage: MessageResolver;
  labels: UiLabels;
}

type PartialUiConfig = Partial<Omit<UiConfig, "labels">> & {
  labels?: {
    form?: Partial<UiFormLabels>;
  };
};

export type {
  MessageResolver,
  PartialUiConfig,
  UiConfig,
  UiFormLabels,
  UiLabels,
};
