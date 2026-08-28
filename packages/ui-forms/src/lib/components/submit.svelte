<script lang="ts">
  import { cn } from "@privaty/ui/cn.js";
  import Button from "@privaty/ui/components/button.svelte";
  import Spinner from "@privaty/ui/components/spinner.svelte";
  import { getUiConfig } from "@privaty/ui/config/context.js";
  import type { Snippet } from "svelte";
  import { getFormContext } from "../context";

  interface Props {
    label?: string;
    submittingLabel?: string;

    disabledUntil?: "dirty-and-valid" | "valid" | "none";

    class?: string;

    /** Icon-style content rendered instead of the label text — the label
     * stays as the accessible name (sr-only + tooltip). */
    children?: Snippet;
  }

  const {
    label,
    submittingLabel,

    disabledUntil = "dirty-and-valid",

    class: classes,

    children,
  }: Props = $props();

  const { state } = getFormContext();
  const config = getUiConfig();

  const resolvedLabel = $derived(label ?? config.labels.form.submit);

  const gateBlocked = $derived(
    disabledUntil === "dirty-and-valid"
      ? !state.isDirty || !state.isValid
      : disabledUntil === "valid"
        ? !state.isValid
        : false,
  );
</script>

<Button
  type="submit"
  disabled={gateBlocked || state.isSubmitting}
  aria-busy={state.isSubmitting}
  title={children ? resolvedLabel : undefined}
  class={cn("inline-flex items-center justify-center gap-2", classes)}
>
  {#if state.isSubmitting}
    <Spinner />
    {#if submittingLabel}
      {submittingLabel}
    {:else}
      <!-- Keep the accessible name when only the spinner is visible. -->
      <span class="sr-only">{resolvedLabel}</span>
    {/if}
  {:else if children}
    {@render children()}
    <span class="sr-only">{resolvedLabel}</span>
  {:else}
    {resolvedLabel}
  {/if}
</Button>
