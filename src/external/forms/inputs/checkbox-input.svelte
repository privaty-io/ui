<script lang="ts">
  import { cn } from "#privaty/ui/cn.js";
  import Checkbox from "#privaty/ui/components/checkbox.svelte";
  import type { CheckboxField } from "../types/field";
  import { wireField } from "./wire-field";

  interface Props {
    field: CheckboxField;
    label: string;

    required?: boolean;
    // Checkboxes have no native readonly, so submitting locks interaction
    // with CSS instead. NEVER disable while submitting: disabled controls are
    // excluded from FormData — a checked box would silently submit as false.
    disabled?: boolean;

    initialValue?: boolean;

    class?: string;
    labelClass?: string;
    inputClass?: string;
    markerClass?: string;
    errorClass?: string;
  }

  const {
    field,
    label,

    required = false,
    disabled = false,

    initialValue = false,

    class: classes,
    labelClass,
    inputClass,
    markerClass,
    errorClass,
  }: Props = $props();

  // The seed rides Kit's as(): it supplies both `checked` and the
  // `defaultChecked` getter (native reset restores the seed). Kit's
  // defaultChecked is non-configurable — never add our own on top.
  const attributes = $derived(field.as("checkbox", initialValue));

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
    // Kit's field state: undefined = untouched (fall back to the seed);
    // null = explicitly UNCHECKED (must not fall through to the seed).
    getValue: () => {
      const value = field.value();
      return value === undefined ? initialValue : value;
    },
    setValue: (value) => field.set(value as boolean),
    // Mid-edit Kit stores the raw DOM value: "on" when checked, null when
    // unchecked.
    normalize: (value) => value === true || value === "on",
  });

  // pointer-events-none blocks the mouse while submitting but not the
  // keyboard — swallow value-changing keys too (Tab stays free).
  function lockKeysWhileSubmitting(event: KeyboardEvent) {
    if (!wired.state.isSubmitting) return;
    if ([" ", "Enter"].includes(event.key)) {
      event.preventDefault();
    }
  }
</script>

<Checkbox
  {...attributes}
  {label}
  errors={wired.errors}
  marker={wired.marker}
  aria-invalid={wired.errors.length > 0 ? true : undefined}
  onkeydown={lockKeysWhileSubmitting}
  {disabled}
  class={classes}
  {labelClass}
  inputClass={cn(wired.state.isSubmitting && "pointer-events-none", inputClass)}
  markerClass={cn(required && "text-red-700 dark:text-red-500", markerClass)}
  {errorClass}
/>
