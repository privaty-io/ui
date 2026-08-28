<script lang="ts">
  import { cn } from "@privaty/ui/cn.js";
  import Input from "@privaty/ui/components/input.svelte";
  import type { LabelStyle } from "@privaty/ui/components/types.js";
  import type { HTMLInputAttributes } from "svelte/elements";
  import type { DateField, DateFieldType } from "../types/field";
  import { wireField } from "./wire-field";

  interface Props {
    field: DateField;
    label: string;
    type?: DateFieldType;

    // No floating: date-family inputs render their format scaffold even when
    // empty, so :placeholder-shown never behaves.
    labelStyle?: Exclude<LabelStyle, "floating">;

    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;

    /** ISO-style string in the chosen type's format (e.g. "2026-08" for
     * month, "2026-08-18" for date). */
    initialValue?: string;

    min?: string;
    max?: string;

    autocomplete?: HTMLInputAttributes["autocomplete"];

    class?: string;
    labelClass?: string;
    inputClass?: string;
    markerClass?: string;
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
