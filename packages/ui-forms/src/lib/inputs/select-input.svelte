<!-- @component
Select wired to a SvelteKit remote form field — must render inside a <Form>,
whose context it registers with. Shows resolver-translated validation errors
once the form state reveals them, plus a majority-aware required/optional
marker. While submitting it locks interaction with CSS and key swallowing
instead of disabling — a disabled select is excluded from FormData.
-->
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
    /** The SvelteKit remote form field to bind. Structural — anything
     * satisfying the SelectField slice works, e.g. a fake from the public
     * testing subpath. */
    field: SelectField;
    /** Visible label text for the control. */
    label: string;

    /** Options to render, in order. A plain string is shorthand for
     * `{ value: s, label: s }`; values must be unique — they key the
     * rendered list. */
    options: readonly (string | SelectOption)[];
    /** The empty option's label — a disabled prompt on required fields, a
     * selectable "none" row on optional ones (see Select's `clearable`;
     * this input derives it from `required`, which never becomes the
     * native attribute). Its presence also makes "" the default seed for
     * an unseeded field. */
    placeholder?: string;

    /** Label placement: "top" (default), "left", or "hidden" — floating is
     * not offered for selects. */
    labelStyle?: Exclude<LabelStyle, "floating">;

    /** Marks the field required: feeds the majority-aware required/optional
     * marker (required markers styled red) — forms where at least half the
     * fields are required mark the optional ones instead. Validation itself
     * comes from the field's schema, not this flag, and it is not forwarded
     * as a native `required` attribute. */
    required?: boolean;
    /**
     * Selects have no native readonly, so submitting locks interaction with
     * CSS instead. NEVER disable while submitting: disabled controls are
     * excluded from FormData, and Kit validates live form data mid-submission
     * — a disabled select vanishes from it and fails its own validation.
     */
    disabled?: boolean;

    /** Seeds the field and marks the matching option `selected`, so native
     * reset restores it. Omitted with a placeholder present, the field is
     * seeded with "" and the placeholder is the initial state. */
    initialValue?: string;

    /** Extra classes for the outer field wrapper. */
    class?: string;
    /** Extra classes for the <label> element. */
    labelClass?: string;
    /** Extra classes for the <select> element. */
    selectClass?: string;
    /** Extra classes for the required/optional marker. */
    markerClass?: string;
    /** Extra classes for the error <ul>. */
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
  clearable={!required}
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
