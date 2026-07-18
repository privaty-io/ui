import type { StandardSchemaV1 } from "@standard-schema/spec";

type MessageResolver = (issue: StandardSchemaV1.Issue) => string;

interface UiLabels {
  optional: string; // the "(optional)" minority marker
  generalError: string; // fallback when a submit throws
}

interface UiConfig {
  resolveMessage: MessageResolver;
  labels: UiLabels;
}

type PartialUiConfig = Partial<Omit<UiConfig, "labels">> & {
  labels?: Partial<UiLabels>;
};

export type { MessageResolver, PartialUiConfig, UiConfig, UiLabels };
