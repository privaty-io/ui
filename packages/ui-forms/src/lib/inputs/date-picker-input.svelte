<!-- @component
Date field with a cross-browser calendar popover, wired to a SvelteKit
remote form field — must render inside a <Form>. The native date input
stays visible as the FormData carrier (typeable, native mobile pickers
intact); the overlaid calendar button opens the library's DatePicker in
an anchored Popover, and a pick writes the input exactly the way typing
does — validation, touch, and dirty tracking behave identically. Values
are the native input's "YYYY-MM-DD" strings.

Firefox exception: it draws an unhideable calendar icon on date inputs
(Bugzilla 1830890), so there the native affordance wins — our trigger
hides and the icon opens Firefox's own date picker (min/max respected;
week numbers and isDateDisabled are picker-side visuals only there —
the schema validates regardless, as always).
-->
<script lang="ts">
  import DatePicker from "@privaty/ui/calendar/date-picker.svelte";
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

    /** Label placement: "top" (default), "left", or "hidden". No floating:
     * date-family inputs render their format scaffold even when empty, so
     * :placeholder-shown never behaves. */
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

    /** Initial "YYYY-MM-DD" value. */
    initialValue?: string;

    /** Inclusive ISO bounds, applied to BOTH the native input and the
     * picker (out-of-range days render disabled). */
    min?: string;
    max?: string;
    /** Marks additional days disabled in the picker (booked dates,
     * weekends, …). Typing can still produce them — validate in the
     * schema, as with every constraint. */
    isDateDisabled?: (iso: string) => boolean;

    /** BCP 47 tag for the picker's names and default week start —
     * overrides `UiConfig.locale`. */
    locale?: string;
    /** ISO weekday the picker grid starts on (Monday = 1 … Sunday = 7). */
    firstDayOfWeek?: number;
    /** Adds the ISO week-number column to the picker. */
    showWeekNumbers?: boolean;

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
    isDateDisabled,

    locale,
    firstDayOfWeek,
    showWeekNumbers = false,

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
  type="date"
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
    <DatePicker
      {value}
      onselect={select}
      {min}
      {max}
      {isDateDisabled}
      {locale}
      {firstDayOfWeek}
      {showWeekNumbers}
    />
  {/snippet}
</PickerFrame>
