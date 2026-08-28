<!-- @component
Shared field chrome — label, optional marker, and error list — around a
control provided as a snippet. The snippet receives { id, errorsId }, which
the control must apply as its `id` and `aria-describedby` for the label link
and error announcement to work. The "floating" labelStyle additionally
requires a cooperating control: it must carry the `peer` class and reserve
room for the label to float into (see input.svelte).
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../cn";
  import { coreTheme } from "../theme";
  import type { LabelStyle } from "./types";

  interface Props {
    /**
     * Id for the control: the label's `for` points at it, and the errors
     * list id derives from it (`${id}-errors`).
     */
    id: string;
    /** Visible label text (rendered sr-only when labelStyle is "hidden"). */
    label: string;
    /**
     * Label placement: "top" (default), "left" (inline before the control),
     * "floating" (overlaid; floats up on focus or content — needs a
     * cooperating control, see the component note), or "hidden" (visually
     * hidden, still read by screen readers).
     */
    labelStyle?: LabelStyle;

    /**
     * Validation messages rendered below the control and announced politely
     * (aria-live). When present, `errorsId` is passed to the control snippet
     * for aria-describedby.
     */
    errors?: string[];
    /** Small annotation rendered after the label text (e.g. "*" for
     * required). */
    marker?: string;

    /** Extra classes for the wrapper <div>. */
    class?: string;
    /** Extra classes for the <label> element. */
    labelClass?: string;
    /** Extra classes for the marker <span>. */
    markerClass?: string;
    /** Extra classes for the error <ul>. */
    errorClass?: string;

    /**
     * Renders the actual form control. Receives { id, errorsId } — apply
     * them as the control's `id` and `aria-describedby` (errorsId is
     * undefined while there are no errors).
     */
    control: Snippet<[{ id: string; errorsId: string | undefined }]>;
  }

  const {
    id,
    label,
    labelStyle = "top",

    errors = [],
    marker,

    class: classes,
    labelClass,
    markerClass,
    errorClass,

    control,
  }: Props = $props();

  const errorsId = $derived(errors.length ? `${id}-errors` : undefined);

  const classDefaults = cn("flex w-full flex-col gap-1");
  const labelClassDefaults = coreTheme.field.label;
  const markerClassDefaults = coreTheme.field.marker;
  const errorClassDefaults = coreTheme.field.error;
</script>

{#snippet labelText()}
  {label}
  {#if marker}
    <span class={cn(markerClassDefaults, markerClass)}>{marker}</span>
  {/if}
{/snippet}

{#snippet errorList()}
  {#if errors.length}
    <!-- aria-live announces newly revealed issues without interrupting. -->
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
{/snippet}

{#if labelStyle === "floating"}
  <div class={cn(classDefaults, classes)}>
    <div class="relative">
      <!-- The control must render before the label, carry the `peer` class,
           and make room for the label to float into (see input.svelte). -->
      {@render control({ id, errorsId })}
      <label
        for={id}
        class={cn(
          labelClassDefaults,
          "absolute top-1/2 left-2.5 -translate-y-1/2 cursor-text transition-[top,translate,font-size,line-height]",
          "peer-focus:top-1 peer-focus:translate-y-0 peer-focus:text-xs",
          "peer-not-placeholder-shown:top-1 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-xs",
          labelClass,
        )}
      >
        {@render labelText()}
      </label>
    </div>

    {@render errorList()}
  </div>
{:else}
  <div class={cn(classDefaults, classes)}>
    <div
      class={cn(
        "flex",
        labelStyle === "left"
          ? "flex-row items-center gap-2"
          : "flex-col gap-1",
      )}
    >
      <label
        for={id}
        class={cn(
          labelClassDefaults,
          labelStyle === "hidden" && "sr-only",
          labelClass,
        )}
      >
        {@render labelText()}
      </label>

      {@render control({ id, errorsId })}
    </div>

    {@render errorList()}
  </div>
{/if}
