import { getContext, setContext } from "svelte";
import type { FormState } from "./form-state.svelte";
import type { ValidatableForm } from "./types/form";

const formContextKey = Symbol("privaty-ui-form-context");

/** What a <Form> shares with its descendants. */
interface FormContext {
  /** The enhanced remote form instance (the preflighted one when the Form
   * was given a schema). */
  form: ValidatableForm;
  /** The form's client-side display state — dirty/touched tracking and
   * error-display gating. */
  state: FormState;
}

/**
 * Shares a form instance and its FormState with descendant components. Called
 * by <Form>; must run during component init. A custom form wrapper can call
 * it to host this library's inputs and buttons.
 */
function setFormContext(context: FormContext) {
  setContext<FormContext>(formContextKey, context);
}

/**
 * Returns the nearest enclosing <Form>'s context. Must be called during
 * component init; throws when no ancestor has set the form context.
 */
function getFormContext(): FormContext {
  const context = getContext<FormContext>(formContextKey);

  if (!context)
    throw new Error(
      "FormContext: form components must be used inside a <Form>",
    );

  return context;
}

export { getFormContext, setFormContext };
