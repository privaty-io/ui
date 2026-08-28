<!-- @component
Text-family input (text, email, password, search, url, tel) wired to a
SvelteKit remote form string field — must render inside a <Form>, whose
context it registers with. Shows resolver-translated validation errors once
the form state reveals them, plus a majority-aware required/optional marker,
and turns readonly while the form submits.
-->
<script lang="ts">
  import { cn } from "@privaty/ui/cn.js";
  import Input from "@privaty/ui/components/input.svelte";
  import type { LabelStyle } from "@privaty/ui/components/types.js";
  import type { HTMLInputAttributes } from "svelte/elements";
  import type { TextField, TextFieldType } from "../types/field";
  import { wireField } from "./wire-field";

  interface Props {
    /** The SvelteKit remote form field to bind. Structural — anything
     * satisfying the TextField slice works, e.g. a fake from the public
     * testing subpath. */
    field: TextField;
    /** Visible label text. In the floating label style it doubles as the
     * placeholder. */
    label: string;
    /** Native input type within the text family. Defaults to "text". */
    type?: TextFieldType;

    /** Label placement: "top" (default), "left", "floating", or "hidden"
     * (visually hidden, still read by screen readers). */
    labelStyle?: LabelStyle;

    /** Marks the field required: feeds the majority-aware required/optional
     * marker (required markers styled red) — forms where at least half the
     * fields are required mark the optional ones instead. Validation itself
     * comes from the field's schema, not this flag, and it is not forwarded
     * as a native `required` attribute. */
    required?: boolean;
    /** Disables the control. Disabled controls are excluded from FormData —
     * never disable to lock the form during submit; the input already turns
     * readonly while submitting. */
    disabled?: boolean;
    /** Renders the input readonly. Also forced on while the form is
     * submitting, independent of this prop. */
    readonly?: boolean;

    /** Seed handed to Kit's `as()` (defaults to "") — the value native form
     * reset restores and the baseline for dirty tracking. Assumed stable for
     * the component's lifetime. */
    initialValue?: string;

    /** Placeholder text — ignored in the floating label style, where the
     * label plays that role. */
    placeholder?: string;
    /** Forwarded to the native input. */
    autocomplete?: HTMLInputAttributes["autocomplete"];

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
