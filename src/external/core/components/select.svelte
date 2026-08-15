<script lang="ts">
  import type { HTMLSelectAttributes } from "svelte/elements";
  import { cn } from "../cn";
  import FieldFrame from "./field-frame.svelte";
  import type { LabelStyle, SelectOption } from "./types";

  // `multiple` is excluded on purpose: multi-selects bind string arrays and
  // belong to a future dedicated component, not a boolean on this one.
  interface Props extends Omit<HTMLSelectAttributes, "class" | "multiple"> {
    label: string;
    labelStyle?: Exclude<LabelStyle, "floating">;

    options: readonly (string | SelectOption)[];
    /** Rendered as a disabled empty option, shown until a value is chosen. */
    placeholder?: string;

    errors?: string[];
    marker?: string;

    class?: string;
    labelClass?: string;
    selectClass?: string;
    markerClass?: string;
    errorClass?: string;
  }

  let {
    label,
    labelStyle = "top",

    options,
    placeholder,

    errors = [],
    marker,

    id: providedId,
    value = $bindable(),

    class: classes,
    labelClass,
    selectClass,
    markerClass,
    errorClass,

    ...rest
  }: Props = $props();

  const uid = $props.id();
  const selectId = $derived(providedId ?? uid);

  const normalizedOptions = $derived(
    options.map((option) =>
      typeof option === "string" ? { value: option, label: option } : option,
    ),
  );

  const selectClassDefaults = cn(
    "w-full cursor-pointer rounded px-2 py-1.5 disabled:cursor-not-allowed",
    "bg-stone-200/25 focus:bg-stone-200/50 enabled:hover:bg-stone-200/75 disabled:bg-stone-200/10",
    "border-stone-400 disabled:border-stone-400/50 disabled:text-stone-600",
    "dark:bg-stone-800/25 dark:focus:bg-stone-800/50 dark:enabled:hover:bg-stone-800/75 dark:disabled:bg-stone-800/10",
    "dark:border-stone-600 dark:disabled:border-stone-600/50 dark:disabled:text-stone-400",
  );
</script>

<FieldFrame
  id={selectId}
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
    <select
      {...rest}
      bind:value
      {id}
      class={cn(selectClassDefaults, selectClass)}
      aria-describedby={errorsId}
    >
      {#if placeholder}
        <option value="" disabled>{placeholder}</option>
      {/if}
      {#each normalizedOptions as option (option.value)}
        <option value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      {/each}
    </select>
  {/snippet}
</FieldFrame>
