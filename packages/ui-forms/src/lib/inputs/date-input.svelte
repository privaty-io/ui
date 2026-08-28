<!-- @component
Date-family input (date, datetime-local, month, time, week) wired to a
SvelteKit remote form field — must render inside a <Form>, whose context it
registers with. Values are ISO-style strings in the chosen type's format.
Shows resolver-translated validation errors once the form state reveals them,
plus a majority-aware required/optional marker, and turns readonly while the
form submits.
-->
<script lang="ts">
  import { cn } from "@privaty/ui/cn.js";
  import Input from "@privaty/ui/components/input.svelte";
  import type { LabelStyle } from "@privaty/ui/components/types.js";
  import type { HTMLInputAttributes } from "svelte/elements";
  import type { DateField, DateFieldType } from "../types/field";
  import { wireField } from "./wire-field";

  interface Props {
    /** The SvelteKit remote form field to bind. Structural — anything
     * satisfying the DateField slice works, e.g. a fake from the public
     * testing subpath. */
    field: DateField;
    /** Visible label text for the control. */
    label: string;
    /** Which date-family input to render: "date" (default),
     * "datetime-local", "month", "time", or "week". */
    type?: DateFieldType;

    /** Label placement: "top" (default), "left", or "hidden". No floating:
     * date-family inputs render their format scaffold even when empty, so
     * :placeholder-shown never behaves. */
    labelStyle?: Exclude<LabelStyle, "floating">;

    /** Marks the field required: feeds the majority-aware required/optional
     * marker (required markers styled red) — forms where at least half the
     * fields are required mark the optional ones instead. Validation itself
     * comes from the field's schema, not this flag, and it is not forwarded
     * as a native `required` attribute. */
    required?: boolean;
    /** Disables the control. Disabled controls are excluded from FormData —
     * never disable to lock the form during submit; the input already turns
     * readonly while submitting. */
    disabled?: boolean;
    /** Renders the input readonly. Also forced on while the form is
     * submitting, independent of this prop. */
    readonly?: boolean;

    /** ISO-style string in the chosen type's format (e.g. "2026-08" for
     * month, "2026-08-18" for date). */
    initialValue?: string;

    /** Native lower bound, in the same format as the value. */
    min?: string;
    /** Native upper bound, in the same format as the value. */
    max?: string;

    /** Passed through to the native autocomplete attribute (e.g. "bday"). */
    autocomplete?: HTMLInputAttributes["autocomplete"];

    /** Extra classes for the outer field wrapper. */
    class?: string;
    /** Extra classes for the <label> element. */
    labelClass?: string;
    /** Extra classes for the <input> element. */
    inputClass?: string;
    /** Extra classes for the required/optional marker. */
    markerClass?: string;
    /** Extra classes for the error <ul>. */
    errorClass?: string;
  }

  const {
    field,
    label,
    type = "date",

    labelStyle,

    required = false,
    disabled = false,
    readonly = false,

    initialValue = "",

    min,
    max,

    autocomplete,

    class: classes,
    labelClass,
    inputClass,
    markerClass,
    errorClass,
  }: Props = $props();

  const attributes = $derived(field.as(type, initialValue));

  // The field, type, and initialValue are stable for the component's lifetime,
  // so capturing the initial name and registration is intentional.
  // svelte-ignore state_referenced_locally
  const name = attributes.name;

  // svelte-ignore state_referenced_locally
  const wired = wireField({
    name,
    initialValue,
    required,
    issues: () => field.issues(),
    getValue: () => field.value(),
    setValue: (value) => field.set(value as string),
    normalize: (value) => (value == null ? "" : String(value)),
  });
</script>

<Input
  {...attributes}
  {label}
  {labelStyle}
  errors={wired.errors}
  marker={wired.marker}
  aria-invalid={wired.errors.length > 0 ? true : undefined}
  {disabled}
  readonly={readonly || wired.state.isSubmitting}
  {min}
  {max}
  {autocomplete}
  class={classes}
  {labelClass}
  {inputClass}
  markerClass={cn(required && "text-red-700 dark:text-red-500", markerClass)}
  {errorClass}
/>
