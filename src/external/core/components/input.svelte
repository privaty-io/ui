<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "../cn";
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

  const classDefaults = cn("flex w-full flex-col gap-1");
  const labelClassDefaults = cn(
    "text-nowrap",
    "text-stone-600 dark:text-stone-400",
  );
  const inputClassDefaults = cn(
    "w-full rounded px-2 py-1.5",
    "bg-stone-200/25 hover:bg-stone-200/75 focus:bg-stone-200/50 active:bg-stone-200/25 disabled:bg-stone-200/10",
    "border-stone-400 placeholder:text-stone-600 disabled:border-stone-400/50 disabled:text-stone-600",
    "dark:bg-stone-800/25 dark:hover:bg-stone-800/75 dark:focus:bg-stone-800/50 dark:active:bg-stone-800/25 dark:disabled:bg-stone-800/10",
    "dark:border-stone-600 dark:placeholder:text-stone-400 dark:disabled:border-stone-600/50 dark:disabled:text-stone-400",
  );
  const markerClassDefaults = cn("text-xs");
  const errorClassDefaults = cn("text-sm text-red-700 dark:text-red-500");
</script>

{#snippet labelText()}
  {label}
  {#if marker}
    <span class={cn(markerClassDefaults, markerClass)}>{marker}</span>
  {/if}
{/snippet}

{#snippet errorList()}
  {#if errors.length}
    <ul id={errorsId} class={cn(errorClassDefaults, errorClass)}>
      {#each errors as error, index (index)}
        <li>{error}</li>
      {/each}
    </ul>
  {/if}
{/snippet}

{#if labelStyle === "floating"}
  <div class={cn(classDefaults, classes)}>
    <div class="relative">
      <input
        {...rest}
        bind:value
        id={inputId}
        class={cn(inputClassDefaults, "peer pt-4 pb-0.5", inputClass)}
        placeholder=" "
        aria-describedby={errorsId}
      />
      <label
        for={inputId}
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
        for={inputId}
        class={cn(
          labelClassDefaults,
          labelStyle === "hidden" && "sr-only",
          labelClass,
        )}
      >
        {@render labelText()}
      </label>

      <input
        {...rest}
        bind:value
        id={inputId}
        class={cn(inputClassDefaults, inputClass)}
        aria-describedby={errorsId}
      />
    </div>

    {@render errorList()}
  </div>
{/if}
