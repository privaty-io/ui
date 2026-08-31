<!-- @component
Week field with a cross-browser picker popover, wired to a SvelteKit
remote form field — must render inside a <Form>. The native week input
stays visible as the FormData carrier (Firefox renders it as a plain
text input — exactly the gap the picker fills); the overlaid calendar
button opens the library's WeekPicker in an anchored Popover, and a pick
writes the input exactly the way typing does. Values are the native
input's "YYYY-Www" strings (ISO-8601 weeks, the Danish convention).
-->
<script lang="ts">
  import WeekPicker from "@privaty/ui/calendar/week-picker.svelte";
  import type { LabelStyle } from "@privaty/ui/components/types.js";
  import type { DateField } from "../types/field";
  import PickerFrame from "./picker-frame.svelte";

  interface Props {
    /** The SvelteKit remote form field to bind. Structural — anything
     * satisfying the DateField slice works, e.g. a fake from the public
     * testing subpath. */
    field: DateField;
    /** Visible label text for the control. */
    label: string;

    /** Label placement: "top" (default), "left", or "hidden". No floating
     * (see DateInput). */
    labelStyle?: Exclude<LabelStyle, "floating">;

    /** Marks the field required: feeds the majority-aware required/optional
     * marker. Validation itself comes from the field's schema. */
    required?: boolean;
    /** Disables the control. Disabled controls are excluded from FormData —
     * never disable to lock the form during submit; the input already turns
     * readonly (and the calendar trigger disables) while submitting. */
    disabled?: boolean;
    /** Renders the input readonly and disables the calendar trigger. */
    readonly?: boolean;

    /** Initial "YYYY-Www" value. */
    initialValue?: string;

    /** Inclusive "YYYY-Www" bounds, applied to BOTH the native input and
     * the picker (out-of-range weeks render disabled). */
    min?: string;
    max?: string;

    /** BCP 47 tag for the picker's names — overrides `UiConfig.locale`.
     * The grid itself is always Monday-first (ISO weeks are only
     * well-defined that way). */
    locale?: string;

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

    labelStyle,

    required = false,
    disabled = false,
    readonly = false,

    initialValue = "",

    min,
    max,

    locale,

    class: classes,
    labelClass,
    inputClass,
    markerClass,
    errorClass,
  }: Props = $props();
</script>

<PickerFrame
  {field}
  {label}
  type="week"
  {labelStyle}
  {required}
  {disabled}
  {readonly}
  {initialValue}
  {min}
  {max}
  class={classes}
  {labelClass}
  {inputClass}
  {markerClass}
  {errorClass}
>
  {#snippet picker({ value, select })}
    <WeekPicker {value} onselect={select} {min} {max} {locale} />
  {/snippet}
</PickerFrame>
