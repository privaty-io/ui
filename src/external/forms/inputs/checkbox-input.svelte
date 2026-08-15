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

  const attributes = $derived(field.as("checkbox"));

  // The field and initialValue are stable for the component's lifetime, so
  // capturing the initial name and registration is intentional.
  // svelte-ignore state_referenced_locally
  const name = attributes.name;

  // Seed a checked edit-form checkbox through the field itself, so the remote
  // form's state and the rendered checked attribute agree from the start.
  // svelte-ignore state_referenced_locally
  if (initialValue) field.set(true);

  // svelte-ignore state_referenced_locally
  const wired = wireField({
    name,
    initialValue,
    required,
    issues: () => field.issues(),
    // Unchecked checkboxes are absent from the data, so undefined means
    // false.
    getValue: () => field.value() ?? false,
    setValue: (value) => field.set(value as boolean),
  });
</script>

<Checkbox
  {...attributes}
  {label}
  errors={wired.errors}
  marker={wired.marker}
  {disabled}
  class={classes}
  {labelClass}
  inputClass={cn(wired.state.isSubmitting && "pointer-events-none", inputClass)}
  markerClass={cn(required && "text-red-700 dark:text-red-500", markerClass)}
  {errorClass}
/>
