<!-- @component
Multi-line text input wired to a SvelteKit remote form string field, rendered
as a textarea — must render inside a <Form>, whose context it registers with.
Shows resolver-translated validation errors once the form state reveals them,
plus a majority-aware required/optional marker, and turns readonly while the
form submits. No floating label style — that is tuned to single-line inputs.
-->
<script lang="ts">
  import { cn } from "@privaty/ui/cn.js";
  import Textarea from "@privaty/ui/components/textarea.svelte";
  import type { LabelStyle } from "@privaty/ui/components/types.js";
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import type { TextField } from "../types/field";
  import { wireField } from "./wire-field";

  interface Props {
    /** The SvelteKit remote form field to bind. Structural — anything
     * satisfying the TextField slice works, e.g. a fake from the public
     * testing subpath. */
    field: TextField;
    /** Visible label text for the control. */
    label: string;

    /** Label placement: "top" (default), "left", or "hidden" (visually
     * hidden, still read by screen readers). */
    labelStyle?: Exclude<LabelStyle, "floating">;

    /** Marks the field required: feeds the majority-aware required/optional
     * marker (required markers styled red) — forms where at least half the
     * fields are required mark the optional ones instead. Validation itself
     * comes from the field's schema, not this flag, and it is not forwarded
     * as a native `required` attribute. */
    required?: boolean;
    /** Disables the control. Disabled controls are excluded from FormData —
     * never disable to lock the form during submit; the textarea already
     * turns readonly while submitting. */
    disabled?: boolean;
    /** Renders the textarea readonly. Also forced on while the form is
     * submitting, independent of this prop. */
    readonly?: boolean;

    /** Seed handed to Kit's `as()` (defaults to "") — the value native form
     * reset restores and the baseline for dirty tracking. Assumed stable for
     * the component's lifetime. */
    initialValue?: string;

    /** Forwarded to the native textarea. */
    placeholder?: string;
    /** Forwarded to the native textarea. */
    autocomplete?: HTMLTextareaAttributes["autocomplete"];
    /** Visible line count (native `rows`). Defaults to 3. */
    rows?: number;

    /** Extra classes for the outer field wrapper. */
    class?: string;
    /** Extra classes for the <label> element. */
    labelClass?: string;
    /** Extra classes for the <textarea> element. */
    textareaClass?: string;
    /** Extra classes for the required/optional marker. */
    markerClass?: string;
    /** Extra classes for the error <ul>. */
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
    autocomplete,
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
    normalize: (value) => (value == null ? "" : String(value)),
  });
</script>

<Textarea
  {...textareaAttributes}
  {label}
  {labelStyle}
  errors={wired.errors}
  marker={wired.marker}
  aria-invalid={wired.errors.length > 0 ? true : undefined}
  {disabled}
  readonly={readonly || wired.state.isSubmitting}
  {placeholder}
  {autocomplete}
  {rows}
  class={classes}
  {labelClass}
  {textareaClass}
  markerClass={cn(required && "text-red-700 dark:text-red-500", markerClass)}
  {errorClass}
/>
