<!-- @component
INTERNAL shared frame for the picker inputs (DatePickerInput,
MonthPickerInput, WeekPickerInput) — not exported. A real native input
wired to a SvelteKit remote form field stays the FormData carrier
(typeable, native mobile pickers intact), with a calendar trigger button
overlaid on its end that opens the given picker in an anchored Popover.

A pick writes the input THE WAY TYPING DOES: DOM value first, then a real
bubbling `input` event. Kit's form-level listener reads the element's
value into field state, and the Form validates and marks the field
touched in exactly the order manual entry would — one write path, no
special programmatic branch.
-->
<script lang="ts">
  import { tick, type Snippet } from "svelte";
  import { CalendarIcon } from "@lucide/svelte";
  import { cn } from "@privaty/ui/cn.js";
  import FieldFrame from "@privaty/ui/components/field-frame.svelte";
  import type { LabelStyle } from "@privaty/ui/components/types.js";
  import { getUiConfig } from "@privaty/ui/config/context.js";
  import { getUiDensity } from "@privaty/ui/config/density.js";
  import Popover from "@privaty/ui/overlays/popover.svelte";
  import { coreTheme } from "@privaty/ui/theme.js";
  import type { DateField, DateFieldType } from "../types/field";
  import { wireField } from "./wire-field";

  interface Props {
    /** The SvelteKit remote form field to bind (structural slice). */
    field: DateField;
    /** Visible label text for the control. */
    label: string;
    /** The native carrier type — also the value format the picker speaks. */
    type: Extract<DateFieldType, "date" | "month" | "week">;

    /** Label placement — no floating (see DateInput). */
    labelStyle?: Exclude<LabelStyle, "floating">;

    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;

    /** ISO-style string in the chosen type's format. */
    initialValue?: string;

    /** Native bounds, forwarded to the input (the wrappers also forward
     * them to their picker). */
    min?: string;
    max?: string;

    class?: string;
    labelClass?: string;
    inputClass?: string;
    markerClass?: string;
    errorClass?: string;

    /** Renders the picker inside the Popover panel. `value` is the field's
     * current string; wire `select` to the picker's `onselect`. */
    picker: Snippet<[{ value: string; select: (iso: string) => void }]>;
  }

  const {
    field,
    label,
    type,

    labelStyle,

    required = false,
    disabled = false,
    readonly = false,

    initialValue = "",

    min,
    max,

    class: classes,
    labelClass,
    inputClass,
    markerClass,
    errorClass,

    picker,
  }: Props = $props();

  const config = getUiConfig();

  const attributes = $derived(field.as(type, initialValue));

  // The field, type, and initialValue are stable for the component's lifetime,
  // so capturing the initial name and registration is intentional.
  // svelte-ignore state_referenced_locally
  const name = attributes.name;

  // svelte-ignore state_referenced_locally
  const wired = wireField({
    name,
    initialValue,
    required,
    issues: () => field.issues(),
    getValue: () => field.value(),
    setValue: (value) => field.set(value as string),
    normalize: (value) => (value == null ? "" : String(value)),
  });

  const densityContext = getUiDensity();
  const compact = $derived(densityContext.density === "compact");

  // What the picker highlights: the field's live value (Kit tracks
  // undefined until the first edit — the seed stands in).
  const currentValue = $derived(String(field.value() ?? initialValue));

  const uid = $props.id();
  const locked = $derived(disabled || readonly || wired.state.isSubmitting);

  let inputElement = $state<HTMLInputElement>();
  let triggerElement = $state<HTMLButtonElement>();
  let open = $state(false);

  function select(iso: string) {
    // The popover can outlive its trigger's enabled state (a submit that
    // starts while it is open) — a locked control accepts no picks.
    if (!inputElement || locked) return;
    inputElement.value = iso;
    // A real bubbling event — Kit's and the Form's listeners sit on the
    // <form>, and Svelte delegates besides.
    inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    open = false;
    // The focused cell just left the top layer with the panel — hand focus
    // back to the trigger, the way light dismiss does.
    void tick().then(() => triggerElement?.focus());
  }
</script>

<FieldFrame
  id={uid}
  {label}
  {labelStyle}
  errors={wired.errors}
  marker={wired.marker}
  class={classes}
  {labelClass}
  markerClass={cn(required && "text-red-700 dark:text-red-500", markerClass)}
  {errorClass}
>
  {#snippet control({ id, errorsId })}
    <span class="relative block w-full">
      <input
        {...attributes}
        bind:this={inputElement}
        {id}
        class={cn(
          coreTheme.controlBase,
          coreTheme.controlSurface,
          compact
            ? coreTheme.controlPadding.compact
            : coreTheme.controlPadding.comfortable,
          // Our trigger replaces Chromium's built-in indicator; pr-8 keeps
          // the text clear of the overlaid button.
          "pr-8 [&::-webkit-calendar-picker-indicator]:hidden",
          inputClass,
        )}
        aria-describedby={errorsId}
        aria-invalid={wired.errors.length > 0 ? true : undefined}
        {disabled}
        readonly={readonly || wired.state.isSubmitting}
        {min}
        {max}
      />
      <Popover bind:open placement="bottom-end">
        {#snippet trigger(props)}
          <button
            type="button"
            bind:this={triggerElement}
            {...props}
            class={coreTheme.controlTrigger}
            disabled={locked}
            title={config.labels.calendar.open}
          >
            <CalendarIcon class="size-4" aria-hidden="true" />
            <span class="sr-only">{config.labels.calendar.open}</span>
          </button>
        {/snippet}
        {@render picker({ value: currentValue, select })}
      </Popover>
    </span>
  {/snippet}
</FieldFrame>
