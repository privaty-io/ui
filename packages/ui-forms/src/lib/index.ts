/**
 * Root barrel for `@privaty/ui-forms` — the package's ONLY app-facing
 * module. The testing fakes live behind their own barrel,
 * `@privaty/ui-forms/testing`, so test doubles never mix into this
 * surface. Folder layout is internal.
 */

export { default as FormError } from "./feedback/form-error/form-error.svelte";
export { default as Reset } from "./controls/reset/reset.svelte";
export { default as Submit } from "./controls/submit/submit.svelte";
export { default as Form } from "./form/form.svelte";
export { default as CheckboxInput } from "./inputs/checkbox-input/checkbox-input.svelte";
export { default as DateInput } from "./inputs/date-input/date-input.svelte";
export { default as DatePickerInput } from "./inputs/date-picker-input/date-picker-input.svelte";
export { default as HiddenInput } from "./inputs/hidden-input/hidden-input.svelte";
export { default as MonthPickerInput } from "./inputs/month-picker-input/month-picker-input.svelte";
export { default as NumberInput } from "./inputs/number-input/number-input.svelte";
export { default as SelectInput } from "./inputs/select-input/select-input.svelte";
export { default as TextareaInput } from "./inputs/textarea-input/textarea-input.svelte";
export { default as TextInput } from "./inputs/text-input/text-input.svelte";
export { default as WeekPickerInput } from "./inputs/week-picker-input/week-picker-input.svelte";

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
  HiddenField,
  HiddenFieldAttributes,
  NumberField,
  NumberFieldAttributes,
  SelectField,
  SelectFieldAttributes,
  TextField,
  TextFieldAttributes,
  TextFieldType,
} from "./types/field";
export type { ValidatableForm } from "./types/form";
