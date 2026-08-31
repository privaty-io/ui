/**
 * Root barrel for `@privaty/ui-forms`. Every export here is also reachable
 * via its deep subpath (e.g. `@privaty/ui-forms/form.svelte`). The testing
 * fakes stay deep-only: `@privaty/ui-forms/testing/fakes.svelte.js`.
 */

export { default as FormError } from "./components/form-error.svelte";
export { default as Reset } from "./components/reset.svelte";
export { default as Submit } from "./components/submit.svelte";
export { default as Form } from "./form.svelte";
export { default as CheckboxInput } from "./inputs/checkbox-input.svelte";
export { default as DateInput } from "./inputs/date-input.svelte";
export { default as NumberInput } from "./inputs/number-input.svelte";
export { default as SelectInput } from "./inputs/select-input.svelte";
export { default as TextareaInput } from "./inputs/textarea-input.svelte";
export { default as TextInput } from "./inputs/text-input.svelte";

// The extension point for custom inputs.
export { wireField } from "./inputs/wire-field";
export type { WiredField, WireFieldOptions } from "./inputs/wire-field";

// The structural field slices custom inputs and fakes are typed against.
export type {
  CheckboxField,
  CheckboxFieldAttributes,
  DateField,
  DateFieldAttributes,
  DateFieldType,
  FieldRegistration,
  NumberField,
  NumberFieldAttributes,
  SelectField,
  SelectFieldAttributes,
  TextField,
  TextFieldAttributes,
  TextFieldType,
} from "./types/field";
export type { ValidatableForm } from "./types/form";
