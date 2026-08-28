<!-- @component
Labeled checkbox with an optional marker and error list. Binds `checked`
(defaults to false), not `value`. Errors are linked to the input via
aria-describedby and announced politely. Generates its own id when none is
provided.
-->
<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "../cn";
  import { coreTheme } from "../theme";

  /**
   * Structurally different from Input on purpose: the box renders before the
   * label in a single row, binds `checked` instead of `value`, and label
   * styles (floating included) don't apply.
   */
  interface Props extends Omit<HTMLInputAttributes, "class" | "type"> {
    /**
     * Always renders as type="checkbox" — the prop exists only so an
     * explicit `type="checkbox"` type-checks.
     */
    type?: "checkbox";

    /** Visible label text, linked via `for`/`id` — clicking it toggles the box. */
    label: string;

    /**
     * Validation messages rendered below the row, linked to the input via
     * aria-describedby and announced politely (aria-live).
     */
    errors?: string[];
    /** Small annotation rendered after the label text (e.g. "*" for
     * required). */
    marker?: string;

    /** Extra classes for the wrapper <div>. */
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
