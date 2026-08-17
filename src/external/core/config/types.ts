import type { StandardSchemaV1 } from "@standard-schema/spec";

type MessageResolver = (issue: StandardSchemaV1.Issue) => string;

interface UiFormLabels {
  optional: string; // the "(optional)" minority marker
  generalError: string; // fallback when a submit throws

  submit: string; // default Submit button label
  reset: string; // default Reset button label
}

interface UiTableLabels {
  actions: string; // actions column header

  edit: string; // default Edit button on display rows
  save: string; // submit label while editing a row
  add: string; // submit label on the create row
  cancel: string; // leave the active editor
}

interface UiLabels {
  form: UiFormLabels;
  table: UiTableLabels;
}

interface UiConfig {
  resolveMessage: MessageResolver;
  labels: UiLabels;
}

type PartialUiConfig = Partial<Omit<UiConfig, "labels">> & {
  labels?: {
    form?: Partial<UiFormLabels>;
    table?: Partial<UiTableLabels>;
  };
};

export type {
  MessageResolver,
  PartialUiConfig,
  UiConfig,
  UiFormLabels,
  UiLabels,
  UiTableLabels,
};
