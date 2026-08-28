<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "../cn";
  import { getUiDensity } from "../config/density";
  import FieldFrame from "./field-frame.svelte";
  import { coreTheme } from "../theme";
  import type { InputType, LabelStyle } from "./types";

  interface Props extends Omit<HTMLInputAttributes, "class" | "type"> {
    type?: InputType;

    label: string;
    labelStyle?: LabelStyle;

    errors?: string[];
    marker?: string;

    class?: string;
    labelClass?: string;
    inputClass?: string;
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
