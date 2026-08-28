<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import { cn } from "../cn";
  import { getUiDensity } from "../config/density";
  import FieldFrame from "./field-frame.svelte";
  import { coreTheme } from "../theme";
  import type { LabelStyle } from "./types";

  // No floating label style: the float-in-the-box mechanics are tuned to the
  // single-line input box; multi-line boxes get the regular label styles.
  interface Props extends Omit<HTMLTextareaAttributes, "class"> {
    label: string;
    labelStyle?: Exclude<LabelStyle, "floating">;

    errors?: string[];
    marker?: string;

    class?: string;
    labelClass?: string;
    textareaClass?: string;
    markerClass?: string;
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
