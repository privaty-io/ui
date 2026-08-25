<script lang="ts">
  import { cn } from "#privaty/ui/cn.js";
  import Textarea from "#privaty/ui/components/textarea.svelte";
  import type { LabelStyle } from "#privaty/ui/components/types.js";
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import type { TextField } from "../types/field";
  import { wireField } from "./wire-field";

  interface Props {
    field: TextField;
    label: string;

    labelStyle?: Exclude<LabelStyle, "floating">;

    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;

    initialValue?: string;

    placeholder?: string;
    rows?: number;

    class?: string;
    labelClass?: string;
    textareaClass?: string;
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

    initialValue = "",

    placeholder,
    rows = 3,

    class: classes,
    labelClass,
    textareaClass,
    markerClass,
    errorClass,
  }: Props = $props();

  // Kit has no textarea `as()` type — but `as("text")` returns exactly what
  // a textarea needs (name, aria-invalid, the value accessors) and its text
  // branch carries no `type` attribute to clash with the element.
  const attributes = $derived(field.as("text", initialValue));

  // The slice TYPES the return broadly as input attributes, whose event-
  // handler element types clash with a textarea — at runtime the object only
  // holds the textarea-compatible members above, so the spread is cast.
  const textareaAttributes = $derived(
    attributes as unknown as Omit<HTMLTextareaAttributes, "class">,
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
    setValue: (value) => field.set(value as string),
  });
</script>

<Textarea
  {...textareaAttributes}
  {label}
  {labelStyle}
  errors={wired.errors}
  marker={wired.marker}
  {disabled}
  readonly={readonly || wired.state.isSubmitting}
  {placeholder}
  {rows}
  class={classes}
  {labelClass}
  {textareaClass}
  markerClass={cn(required && "text-red-700 dark:text-red-500", markerClass)}
  {errorClass}
/>
