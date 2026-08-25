import type { StandardSchemaV1 } from "@standard-schema/spec";

type MessageResolver = (issue: StandardSchemaV1.Issue) => string;

interface UiFormLabels {
  optional: string; // the "(optional)" minority marker
  generalError: string; // fallback when a submit throws

  submit: string; // default Submit button label
  reset: string; // default Reset button label
}

interface UiTableLabels {
  actions: string; // actions column header (sr-only when the Add button shows)

  edit: string; // default Edit button on display rows
  delete: string; // default Delete button on display rows
  save: string; // submit label while editing a row
  add: string; // submit label on the create row + the header Add button
  cancel: string; // leave the active editor

  empty: string; // filler-row message when the table has no rows
  expand: string; // the row expander toggle
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
