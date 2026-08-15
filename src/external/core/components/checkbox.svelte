<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "../cn";

  // Structurally different from Input on purpose: the box renders before the
  // label in a single row, binds `checked` instead of `value`, and label
  // styles (floating included) don't apply.
  interface Props extends Omit<HTMLInputAttributes, "class" | "type"> {
    type?: "checkbox";

    label: string;

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

    errors = [],
    marker,

    id: providedId,
    checked = $bindable(false),

    class: classes,
    labelClass,
    inputClass,
    markerClass,
    errorClass,

    ...rest
  }: Props = $props();

  const uid = $props.id();
  const inputId = $derived(providedId ?? uid);
  const errorsId = $derived(errors.length ? `${inputId}-errors` : undefined);

  const labelClassDefaults = cn(
    "cursor-pointer text-stone-600 dark:text-stone-400",
  );
  const inputClassDefaults = cn(
    "size-4 cursor-pointer disabled:cursor-not-allowed",
    "accent-stone-800 dark:accent-stone-200",
  );
  const markerClassDefaults = cn("text-xs");
  const errorClassDefaults = cn("text-sm text-red-700 dark:text-red-500");
</script>

<div class={cn("flex w-full flex-col gap-1", classes)}>
  <div class="flex items-center gap-2">
    <input
      {...rest}
      bind:checked
      type="checkbox"
      id={inputId}
      class={cn(inputClassDefaults, inputClass)}
      aria-describedby={errorsId}
    />
    <label for={inputId} class={cn(labelClassDefaults, labelClass)}>
      {label}
      {#if marker}
        <span class={cn(markerClassDefaults, markerClass)}>{marker}</span>
      {/if}
    </label>
  </div>

  {#if errors.length}
    <ul id={errorsId} class={cn(errorClassDefaults, errorClass)}>
      {#each errors as error, index (index)}
        <li>{error}</li>
      {/each}
    </ul>
  {/if}
</div>
