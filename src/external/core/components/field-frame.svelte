<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../cn";
  import { coreTheme } from "../theme";
  import type { LabelStyle } from "./types";

  interface Props {
    id: string;
    label: string;
    labelStyle?: LabelStyle;

    errors?: string[];
    marker?: string;

    class?: string;
    labelClass?: string;
    markerClass?: string;
    errorClass?: string;

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
