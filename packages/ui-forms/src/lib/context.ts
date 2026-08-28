import { getContext, setContext } from "svelte";
import type { FormState } from "./form-state.svelte";
import type { ValidatableForm } from "./types/form";

const formContextKey = Symbol("privaty-ui-form-context");

interface FormContext {
  form: ValidatableForm;
  state: FormState;
}

function setFormContext(context: FormContext) {
  setContext<FormContext>(formContextKey, context);
}

function getFormContext(): FormContext {
  const context = getContext<FormContext>(formContextKey);

  if (!context)
    throw new Error(
      "FormContext: form components must be used inside a <Form>",
    );

  return context;
}

export { getFormContext, setFormContext };
