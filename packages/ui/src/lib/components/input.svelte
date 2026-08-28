<!-- @component
Labeled single-line text control wrapping a native `<input>`. All remaining
native input attributes pass through and `value` is bindable. Sizes itself
from the ambient UI density context; in the floating label style the label
doubles as the placeholder and a consumer-provided `placeholder` is ignored.
-->
<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "../cn";
  import { getUiDensity } from "../config/density";
  import FieldFrame from "./field-frame.svelte";
  import { coreTheme } from "../theme";
  import type { InputType, LabelStyle } from "./types";

  interface Props extends Omit<HTMLInputAttributes, "class" | "type"> {
    /** Input type, restricted to box-shaped, `value`-bindable types — see
     * `InputType` for what is excluded and why. Omitted, the browser
     * defaults to `text`. */
    type?: InputType;

    /** Label text. Always rendered — the "hidden" label style keeps it
     * screen-reader-only. */
    label: string;
    /** Label placement: "top" (default), "left", "floating", or "hidden"
     * (visually hidden, still read by screen readers). With "floating" the
     * label doubles as the placeholder and the `placeholder` prop is
     * ignored. */
    labelStyle?: LabelStyle;

    /** Validation messages rendered as a list under the control, linked to
     * it via `aria-describedby` and announced politely when they appear. */
    errors?: string[];
    /** Small annotation rendered after the label text (e.g. "*" for
     * required). */
    marker?: string;

    /** Extra classes for the outer field wrapper. */
    class?: string;
    /** Extra classes for the <label> element. */
    labelClass?: string;
    /** Extra classes for the <input> element. */
    inputClass?: string;
    /** Extra classes for the marker <span>. */
    markerClass?: string;
    /** Extra classes for the error <ul>. */
    errorClass?: string;
  }

  let {
    label,
    labelStyle = "top",

    errors = [],
    marker,

    id: providedId,
    value = $bindable(),
    placeholder,

    class: classes,
    labelClass,
    inputClass,
    markerClass,
    errorClass,

    ...rest
  }: Props = $props();

  const uid = $props.id();
  const inputId = $derived(providedId ?? uid);

  // Ambient density (e.g. from a compact table) sizes the control; the
  // floating label style keeps its own vertical rhythm — the float needs
  // the room.
  const densityContext = getUiDensity();
  const compact = $derived(densityContext.density === "compact");

  const inputClassDefaults = cn(
    coreTheme.controlBase,
    coreTheme.controlSurface,
  );
</script>

<FieldFrame
  id={inputId}
  {label}
  {labelStyle}
  {errors}
  {marker}
  class={classes}
  {labelClass}
  {markerClass}
  {errorClass}
>
  {#snippet control({ id, errorsId })}
    <!-- In the floating style the label acts as the placeholder: the input
         always carries a blank one (so :placeholder-shown works), and any
         consumer-provided placeholder is ignored. -->
    <input
      {...rest}
      bind:value
      {id}
      class={cn(
        inputClassDefaults,
        compact
          ? coreTheme.controlPadding.compact
          : coreTheme.controlPadding.comfortable,
        labelStyle === "floating" && "peer pt-4 pb-0.5",
        inputClass,
      )}
      placeholder={labelStyle === "floating" ? " " : placeholder}
      aria-describedby={errorsId}
    />
  {/snippet}
</FieldFrame>
