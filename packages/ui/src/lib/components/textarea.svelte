<!-- @component
Labeled multi-line text control wrapping a native `<textarea>`. All remaining
native textarea attributes pass through and `value` is bindable. Sizes itself
from the ambient UI density context; the floating label style is not
available.
-->
<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import { cn } from "../cn";
  import { getUiDensity } from "../config/density";
  import FieldFrame from "./field-frame.svelte";
  import { coreTheme } from "../theme";
  import type { LabelStyle } from "./types";

  interface Props extends Omit<HTMLTextareaAttributes, "class"> {
    /** Label text. Always rendered — the "hidden" label style keeps it
     * screen-reader-only. */
    label: string;
    /** Label placement: "top" (default), "left", or "hidden". No floating
     * label style: the float-in-the-box mechanics are tuned to the
     * single-line input box; multi-line boxes get the regular label
     * styles. */
    labelStyle?: Exclude<LabelStyle, "floating">;

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
    /** Extra classes for the <textarea> element. */
    textareaClass?: string;
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

    class: classes,
    labelClass,
    textareaClass,
    markerClass,
    errorClass,

    ...rest
  }: Props = $props();

  const uid = $props.id();
  const textareaId = $derived(providedId ?? uid);

  // Ambient density (e.g. from a compact table) sizes the control.
  const densityContext = getUiDensity();
  const compact = $derived(densityContext.density === "compact");

  const textareaClassDefaults = cn(
    coreTheme.controlBase,
    coreTheme.controlSurface,
  );
</script>

<FieldFrame
  id={textareaId}
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
    <textarea
      {...rest}
      bind:value
      {id}
      class={cn(
        textareaClassDefaults,
        compact
          ? coreTheme.controlPadding.compact
          : coreTheme.controlPadding.comfortable,
        textareaClass,
      )}
      aria-describedby={errorsId}></textarea>
  {/snippet}
</FieldFrame>
