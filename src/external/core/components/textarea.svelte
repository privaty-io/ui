<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import { cn } from "../cn";
  import { getUiDensity } from "../config/density";
  import FieldFrame from "./field-frame.svelte";
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
    "w-full rounded px-2",
    "bg-stone-200/25 hover:bg-stone-200/75 focus:bg-stone-200/50 active:bg-stone-200/25 disabled:bg-stone-200/10",
    "border-stone-400 placeholder:text-stone-600 disabled:border-stone-400/50 disabled:text-stone-600",
    "dark:bg-stone-800/25 dark:hover:bg-stone-800/75 dark:focus:bg-stone-800/50 dark:active:bg-stone-800/25 dark:disabled:bg-stone-800/10",
    "dark:border-stone-600 dark:placeholder:text-stone-400 dark:disabled:border-stone-600/50 dark:disabled:text-stone-400",
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
        compact ? "py-0.5 text-sm" : "py-1.5",
        textareaClass,
      )}
      aria-describedby={errorsId}></textarea>
  {/snippet}
</FieldFrame>
