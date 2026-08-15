import { SvelteMap, SvelteSet } from "svelte/reactivity";
import type { FieldRegistration } from "./types/field";
import type { ValidatableForm } from "./types/form";

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
    this.form.validate({ includeUntouched: true });
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
