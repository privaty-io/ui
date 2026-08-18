import { SvelteMap, SvelteSet } from "svelte/reactivity";
import type { FieldRegistration } from "./types/field";
import type { ValidatableForm } from "./types/form";

/**
 * Client-side display state for a form: dirty/touched tracking and
 * error-display gating.
 *
 * Kit v3 ships field.dirty(), field.touched() and form `submitted`, but none
 * substitute for this class (evaluated against the next.23 source):
 * - Kit's dirty() is an edited-once FLAG that never clears when a value is
 *   edited back; isDirty here compares values, so edit-then-revert returns
 *   to pristine — which drives Submit's dirty-and-valid gate and Reset's
 *   disabled-while-pristine.
 * - Kit's touched() flips on BLUR (and on set()); ours flips on input after
 *   validation, so issues appear while typing in the flash-safe order.
 * - Kit's `submitted` only flips once a submission actually starts;
 *   submitAttempted must open the error gates on gate-BLOCKED attempts too.
 */
class FormState {
  private form: ValidatableForm;

  private fields = new SvelteMap<string, FieldRegistration>();
  private touched = new SvelteSet<string>();

  public submitAttempted = $state<boolean>(false);
  public submitError = $state<unknown>();

  /**
   * True once every field has registered (the Form flips it on mount).
   * Majority-dependent display like the required/optional markers waits for
   * it — a partial registration set would render the wrong marker first.
   */
  public settled = $state<boolean>(false);

  constructor(form: ValidatableForm) {
    this.form = form;
  }

  public readonly isDirty = $derived.by<boolean>(() => {
    for (const field of this.fields.values()) {
      const value = field.getValue() ?? field.initialValue;
      if (value !== field.initialValue) return true;
    }
    return false;
  });

  public readonly isValid = $derived.by<boolean>(
    () => !this.form.fields.allIssues()?.length,
  );

  public readonly isSubmitting = $derived.by<boolean>(
    () => this.form.pending > 0,
  );

  public readonly majorityRequired = $derived.by<boolean>(() => {
    let required = 0;
    let optional = 0;

    for (const field of this.fields.values()) {
      if (field.required) required++;
      else optional++;
    }

    return required >= optional;
  });

  public register(field: FieldRegistration): () => void {
    if (this.fields.has(field.name))
      throw new Error(`FormState: field '${field.name}' is already registered`);

    this.fields.set(field.name, field);

    return () => {
      this.fields.delete(field.name);
      this.touched.delete(field.name);
    };
  }

  public markTouched(name: string): void {
    this.touched.add(name);
  }

  public shouldShowIssues(name: string): boolean {
    return this.submitAttempted || this.touched.has(name);
  }

  public validate(): void {
    // Kit's validate() awaits a tick before reading the form element, so it
    // rejects if the form unmounts during that tick (e.g. reset-on-success
    // right before the Form is removed). Validation for an unmounted form
    // means nothing — swallow it.
    void Promise.resolve(this.form.validate({ all: true })).catch(() => {});
  }

  public reset(): void {
    for (const field of this.fields.values()) {
      field.setValue(field.initialValue);
    }

    this.touched.clear();
    this.submitAttempted = false;
    this.submitError = undefined;

    this.validate();
  }
}

export { FormState };
