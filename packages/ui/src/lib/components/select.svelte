<!-- @component
Labeled dropdown wrapping a native `<select>` with an overlaid themed
chevron. Options are plain strings or `{ value, label, disabled? }` objects;
`value` is bindable and remaining native select attributes pass through.
Sizes itself from the ambient UI density context. Single-select only —
`multiple` is deliberately unsupported.
-->
<script lang="ts">
  import { ChevronDownIcon } from "@lucide/svelte";
  import type { HTMLSelectAttributes } from "svelte/elements";
  import { cn } from "../cn";
  import { getUiDensity } from "../config/density";
  import FieldFrame from "./field-frame.svelte";
  import { coreTheme } from "../theme";
  import type { LabelStyle, SelectOption } from "./types";

  // `multiple` is excluded on purpose: multi-selects bind string arrays and
  // belong to a future dedicated component, not a boolean on this one.
  interface Props extends Omit<HTMLSelectAttributes, "class" | "multiple"> {
    /** Label text. Always rendered — the "hidden" label style keeps it
     * screen-reader-only. */
    label: string;
    /** Label placement: "top" (default), "left", or "hidden". No floating
     * style: the float mechanics depend on `:placeholder-shown`, which a
     * select never matches. */
    labelStyle?: Exclude<LabelStyle, "floating">;

    /** Options to render, in order. A plain string is shorthand for
     * `{ value: s, label: s }`. Values must be unique — they key the
     * rendered list. */
    options: readonly (string | SelectOption)[];
    /** Rendered as a disabled empty option, shown until a value is chosen. */
    placeholder?: string;
    /** Marks the matching option `selected`, so a native form reset returns
     * to it instead of the browser's first-option fallback. */
    defaultValue?: string;

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
    /** Extra classes for the <select> element. */
    selectClass?: string;
    /** Extra classes for the marker <span>. */
    markerClass?: string;
    /** Extra classes for the error <ul>. */
    errorClass?: string;
  }

  let {
    label,
    labelStyle = "top",

    options,
    placeholder,
    defaultValue,

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

  // Ambient density (e.g. from a compact table) sizes the control.
  const densityContext = getUiDensity();
  const compact = $derived(densityContext.density === "compact");

  const selectClassDefaults = cn(
    coreTheme.controlBase,
    coreTheme.controlSurface,
    coreTheme.select,
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
    <!-- A select cannot contain children, so the chevron overlays it from a
         relative wrapper (appearance-none removed the native arrow). -->
    <div class="relative w-full">
      <select
        {...rest}
        bind:value
        {id}
        class={cn(
          selectClassDefaults,
          compact
            ? coreTheme.controlPadding.compact
            : coreTheme.controlPadding.comfortable,
          selectClass,
        )}
        aria-describedby={errorsId}
      >
        {#if placeholder}
          <option value="" disabled selected={defaultValue === ""}>
            {placeholder}
          </option>
        {/if}
        {#each normalizedOptions as option (option.value)}
          <option
            value={option.value}
            disabled={option.disabled}
            selected={option.value === defaultValue}
          >
            {option.label}
          </option>
        {/each}
      </select>
      <ChevronDownIcon class={coreTheme.selectChevron} aria-hidden="true" />
    </div>
  {/snippet}
</FieldFrame>
