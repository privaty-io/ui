<!-- @component
Submit button — must render inside a <Form> (throws otherwise). Disabled
per `disabledUntil` (default "dirty-and-valid") and always while submitting,
when it shows a spinner, sets aria-busy, and swaps to `submittingLabel` when
one is given.
-->
<script lang="ts">
  import { cn } from "@privaty/ui/cn.js";
  import Button from "@privaty/ui/components/button.svelte";
  import Spinner from "@privaty/ui/components/spinner.svelte";
  import { getUiConfig } from "@privaty/ui/config/context.js";
  import type { Snippet } from "svelte";
  import { getFormContext } from "../context";

  interface Props {
    /** Button label — defaults to the configured `labels.form.submit`. */
    label?: string;
    /** Label shown next to the spinner while submitting. Without it only the
     * spinner is visible and the label stays as the sr-only accessible name. */
    submittingLabel?: string;

    /** Validity gate: "dirty-and-valid" (default) disables the button until
     * the form is both dirty and issue-free, "valid" only requires issue-free,
     * "none" removes the gate. The button is always disabled while submitting
     * regardless. */
    disabledUntil?: "dirty-and-valid" | "valid" | "none";

    /** Extra classes for the button. */
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
