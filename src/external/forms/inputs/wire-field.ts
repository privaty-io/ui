import { getUiConfig } from "#privaty/ui/config/context.js";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { onDestroy } from "svelte";
import { getFormContext } from "../context";
import type { FormState } from "../form-state.svelte";

interface WireFieldOptions {
  name: string;
  initialValue: unknown;
  required: boolean;
  issues: () => readonly StandardSchemaV1.Issue[] | undefined;
  getValue: () => unknown;
  setValue: (value: unknown) => void;
}

interface WiredField {
  state: FormState;
  readonly errors: string[];
  readonly marker: string | undefined;
}

/**
 * The wiring every form input shares: registers the field with the FormState
 * (unregistering on destroy), and exposes the gated, resolver-translated
 * errors plus the majority-aware required/optional marker.
 *
 * Must be called during component init (it uses context and onDestroy). The
 * getters recompute on access, so reads from a template stay reactive.
 */
function wireField(options: WireFieldOptions): WiredField {
  const { state } = getFormContext();
  const config = getUiConfig();

  onDestroy(
    state.register({
      name: options.name,
      initialValue: options.initialValue,
      required: options.required,
      getValue: options.getValue,
      setValue: options.setValue,
    }),
  );

  return {
    state,
    get errors() {
      return state.shouldShowIssues(options.name)
        ? (options.issues() ?? []).map((issue) => config.resolveMessage(issue))
        : [];
    },
    get marker() {
      // Markers wait until every field has registered — a partial majority
      // would render the wrong marker first (visible as an SSR/load flash).
      if (!state.settled) return undefined;

      return state.majorityRequired
        ? options.required
          ? undefined
          : config.labels.form.optional
        : options.required
          ? "*"
          : undefined;
    },
  };
}

export { wireField };
export type { WiredField, WireFieldOptions };
