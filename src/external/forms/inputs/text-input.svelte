<script lang="ts">
  import { cn } from "@privaty/ui/cn";
  import Input from "@privaty/ui/components/input.svelte";
  import type { LabelStyle } from "@privaty/ui/components/types";
  import { getUiConfig } from "@privaty/ui/config/context";
  import { onDestroy } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { getFormContext } from "../context";
  import type { TextField, TextFieldType } from "../types/field";

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

  const { state } = getFormContext();
  const config = getUiConfig();

  const attributes = $derived(field.as(type, initialValue));

  // The field, type, and initialValue are stable for the component's lifetime,
  // so capturing the initial name and registration is intentional.
  // svelte-ignore state_referenced_locally
  const name = attributes.name;

  // svelte-ignore state_referenced_locally
  const unregister = state.register({
    name,
    initialValue,
    required,
    getValue: () => field.value(),
    setValue: (value) => field.set(value as string),
  });

  onDestroy(unregister);

  const errors = $derived(
    state.shouldShowIssues(name)
      ? (field.issues() ?? []).map((issue) => config.resolveMessage(issue))
      : [],
  );

  const marker = $derived(
    state.majorityRequired
      ? required
        ? undefined
        : config.labels.form.optional
      : required
        ? "*"
        : undefined,
  );
</script>

<Input
  {...attributes}
  {label}
  {labelStyle}
  {errors}
  {marker}
  {disabled}
  readonly={readonly || state.isSubmitting}
  {placeholder}
  {autocomplete}
  class={classes}
  {labelClass}
  {inputClass}
  markerClass={cn(required && "text-red-700 dark:text-red-500", markerClass)}
  {errorClass}
/>
