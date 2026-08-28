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
   * True when the form has a client-side (preflight) schema, so validation
   * triggered from here can stay off the network. Set by the Form component.
   */
  public clientOnlyValidation = false;

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
      // Both sides pass through the field's normalizer: Kit stores raw DOM
      // strings mid-edit while registrations hold typed seeds, so "5" vs 5
      // and "on" vs true must compare equal. Only undefined means
      // "untouched" — null is a real value (Kit's unchecked checkbox).
      const raw = field.getValue();
      const value = field.normalize(
        raw === undefined ? field.initialValue : raw,
      );
      if (value !== field.normalize(field.initialValue)) return true;
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
    // Defensive catch: validation for a form that unmounted (or failed a
    // network round-trip) mid-call has nowhere useful to surface from here.
    void Promise.resolve(
      this.form.validate({
        all: true,
        preflightOnly: this.clientOnlyValidation,
      }),
    ).catch(() => {});
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
