import { getUiConfig } from "@privaty/ui/config/context.js";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { onDestroy } from "svelte";
import { getFormContext } from "../context";
import type { FormState } from "../form-state.svelte";

interface WireFieldOptions {
  /** The field's form name (from the attributes Kit's `as(...)` returned).
   * Must be unique within the form. */
  name: string;
  /** The typed seed value — the baseline for dirty comparison and what
   * reset restores. */
  initialValue: unknown;
  /** Whether the field is required — feeds the majority-aware marker. */
  required: boolean;
  /** Returns the field's current issues (the field's `issues()`). */
  issues: () => readonly StandardSchemaV1.Issue[] | undefined;
  /** Reads the field's current value — raw DOM strings can appear mid-edit. */
  getValue: () => unknown;
  /** Writes a value back to the field — used by the form-level reset. */
  setValue: (value: unknown) => void;
  /** Maps raw field values onto the initialValue's domain before dirty
   * comparison (e.g. "5" vs 5, "on" vs true). */
  normalize: (value: unknown) => unknown;
}

interface WiredField {
  /** The owning form's FormState — inputs read e.g. isSubmitting from it. */
  state: FormState;
  /** Resolver-translated issue messages, or empty while the field's issues
   * are gated (not yet touched and no submit attempted). Recomputed on
   * access, so template reads stay reactive. */
  readonly errors: string[];
  /** The required/optional label text for the field's marker, or undefined —
   * only the form's minority kind is marked, and nothing renders until every
   * field has registered. */
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
      normalize: options.normalize,
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
          ? config.labels.form.required
          : undefined;
    },
  };
}

export { wireField };
export type { WiredField, WireFieldOptions };
