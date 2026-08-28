<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "../cn";
  import { coreTheme } from "../theme";

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

  const labelClassDefaults = coreTheme.checkbox.label;
  const inputClassDefaults = coreTheme.checkbox.box;
  const markerClassDefaults = coreTheme.field.marker;
  const errorClassDefaults = coreTheme.field.error;
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
    <ul
      id={errorsId}
      aria-live="polite"
      class={cn(errorClassDefaults, errorClass)}
    >
      {#each errors as error, index (index)}
        <li>{error}</li>
      {/each}
    </ul>
  {/if}
</div>
