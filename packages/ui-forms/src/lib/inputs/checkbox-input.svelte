<!-- @component
Checkbox wired to a SvelteKit remote form boolean field — must render inside
a <Form>, whose context it registers with. Shows resolver-translated
validation errors once the form state reveals them, plus a majority-aware
required/optional marker. While submitting it locks interaction with CSS and
key swallowing instead of disabling — a disabled checkbox is excluded from
FormData and would silently submit as false.
-->
<script lang="ts">
  import { cn } from "@privaty/ui/cn.js";
  import Checkbox from "@privaty/ui/components/checkbox.svelte";
  import type { CheckboxField } from "../types/field";
  import { wireField } from "./wire-field";

  interface Props {
    /** The SvelteKit remote form field to bind. Structural — anything
     * satisfying the CheckboxField slice works, e.g. a fake from the public
     * testing subpath. */
    field: CheckboxField;
    /** Visible label text, rendered next to the box. */
    label: string;

    /** Marks the field required: feeds the majority-aware required/optional
     * marker (required markers styled red) — forms where at least half the
     * fields are required mark the optional ones instead. Validation itself
     * comes from the field's schema, not this flag, and it is not forwarded
     * as a native `required` attribute. */
    required?: boolean;
    /**
     * Checkboxes have no native readonly, so submitting locks interaction
     * with CSS instead. NEVER disable while submitting: disabled controls are
     * excluded from FormData — a checked box would silently submit as false.
     */
    disabled?: boolean;

    /** Initial checked state (default false); native form reset restores
     * it. */
    initialValue?: boolean;

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
