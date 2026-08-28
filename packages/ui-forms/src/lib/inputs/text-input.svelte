<script lang="ts">
  import { cn } from "@privaty/ui/cn.js";
  import Input from "@privaty/ui/components/input.svelte";
  import type { LabelStyle } from "@privaty/ui/components/types.js";
  import type { HTMLInputAttributes } from "svelte/elements";
  import type { TextField, TextFieldType } from "../types/field";
  import { wireField } from "./wire-field";

  interface Props {
    field: TextField;
    label: string;
    type?: TextFieldType;

    labelStyle?: LabelStyle;

    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;

    initialValue?: string;

    placeholder?: string;
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
    type = "text",

    labelStyle,

    required = false,
    disabled = false,
    readonly = false,

    initialValue = "",

    placeholder,
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
  {placeholder}
  {autocomplete}
  class={classes}
  {labelClass}
  {inputClass}
  markerClass={cn(required && "text-red-700 dark:text-red-500", markerClass)}
  {errorClass}
/>
