<script lang="ts">
  import { cn } from "@privaty/ui/cn.js";
  import Input from "@privaty/ui/components/input.svelte";
  import type { LabelStyle } from "@privaty/ui/components/types.js";
  import type { NumberField } from "../types/field";
  import { wireField } from "./wire-field";

  interface Props {
    field: NumberField;
    label: string;

    labelStyle?: LabelStyle;

    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;

    initialValue?: number;

    min?: number;
    max?: number;
    step?: number | "any";

    placeholder?: string;

    class?: string;
    labelClass?: string;
    inputClass?: string;
    markerClass?: string;
    errorClass?: string;
  }

  const {
    field,
    label,

    labelStyle,

    required = false,
    disabled = false,
    readonly = false,

    initialValue,

    min,
    max,
    step,

    placeholder,

    class: classes,
    labelClass,
    inputClass,
    markerClass,
    errorClass,
  }: Props = $props();

  const attributes = $derived(
    initialValue === undefined
      ? field.as("number")
      : field.as("number", initialValue),
  );

  // The field and initialValue are stable for the component's lifetime, so
  // capturing the initial name and registration is intentional.
  // svelte-ignore state_referenced_locally
  const name = attributes.name;

  // svelte-ignore state_referenced_locally
  const wired = wireField({
    name,
    initialValue,
    required,
    issues: () => field.issues(),
    getValue: () => field.value(),
    setValue: (value) => field.set(value as number),
    // Kit stores the raw DOM string mid-edit; "" (cleared) means unset.
    normalize: (value) =>
      value === "" || value == null ? undefined : Number(value),
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
  {step}
  {placeholder}
  class={classes}
  {labelClass}
  {inputClass}
  markerClass={cn(required && "text-red-700 dark:text-red-500", markerClass)}
  {errorClass}
/>
