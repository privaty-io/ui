<script lang="ts">
  import { cn } from "@privaty/ui/cn.js";
  import Select from "@privaty/ui/components/select.svelte";
  import type {
    LabelStyle,
    SelectOption,
  } from "@privaty/ui/components/types.js";
  import type { SelectField } from "../types/field";
  import { wireField } from "./wire-field";

  interface Props {
    field: SelectField;
    label: string;

    options: readonly (string | SelectOption)[];
    placeholder?: string;

    labelStyle?: Exclude<LabelStyle, "floating">;

    required?: boolean;
    // Selects have no native readonly, so submitting locks interaction with
    // CSS instead. NEVER disable while submitting: disabled controls are
    // excluded from FormData, and Kit validates live form data mid-submission
    // — a disabled select vanishes from it and fails its own validation.
    disabled?: boolean;

    initialValue?: string;

    class?: string;
    labelClass?: string;
    selectClass?: string;
    markerClass?: string;
    errorClass?: string;
  }

  const {
    field,
    label,

    options,
    placeholder,

    labelStyle,

    required = false,
    disabled = false,

    initialValue,

    class: classes,
    labelClass,
    selectClass,
    markerClass,
    errorClass,
  }: Props = $props();

  // With a placeholder, the natural empty state is the placeholder option —
  // so an unseeded field is seeded with "". Without the seed, browsers select
  // the first enabled option (skipping the disabled placeholder) while the
  // field state stays unset, so the submission would carry no value at all.
  // svelte-ignore state_referenced_locally
  const seed = initialValue ?? (placeholder !== undefined ? "" : undefined);

  const attributes = $derived(
    seed === undefined ? field.as("select") : field.as("select", seed),
  );

  // The field and seed are stable for the component's lifetime, so capturing
  // the initial name and registration is intentional.
  // svelte-ignore state_referenced_locally
  const name = attributes.name;

  // svelte-ignore state_referenced_locally
  const wired = wireField({
    name,
    initialValue: seed,
    required,
    issues: () => field.issues(),
    getValue: () => field.value(),
    setValue: (value) => field.set(value as never),
    normalize: (value) => (value == null ? "" : String(value)),
  });

  // pointer-events-none blocks the mouse while submitting but not the
  // keyboard — swallow value-changing keys too (Tab stays free).
  function lockKeysWhileSubmitting(event: KeyboardEvent) {
    if (!wired.state.isSubmitting) return;
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " ",
        "Enter",
      ].includes(event.key)
    ) {
      event.preventDefault();
    }
  }
</script>

<Select
  {...attributes}
  {label}
  {labelStyle}
  {options}
  {placeholder}
  errors={wired.errors}
  marker={wired.marker}
  aria-invalid={wired.errors.length > 0 ? true : undefined}
  defaultValue={seed}
  onkeydown={lockKeysWhileSubmitting}
  {disabled}
  class={classes}
  {labelClass}
  selectClass={cn(
    wired.state.isSubmitting && "pointer-events-none",
    selectClass,
  )}
  markerClass={cn(required && "text-red-700 dark:text-red-500", markerClass)}
  {errorClass}
/>
