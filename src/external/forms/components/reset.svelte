<script lang="ts">
  import Button from "#privaty/ui/components/button.svelte";
  import { getUiConfig } from "#privaty/ui/config/context.js";
  import { getFormContext } from "../context";

  import type { Snippet } from "svelte";

  interface Props {
    label?: string;

    class?: string;

    /** Icon-style content rendered instead of the label text — the label
     * stays as the accessible name (sr-only + tooltip). */
    children?: Snippet;
  }

  const { label, class: classes, children }: Props = $props();

  const { state } = getFormContext();
  const config = getUiConfig();

  const resolvedLabel = $derived(label ?? config.labels.form.reset);
</script>

<!-- Nothing to reset while pristine; the native reset event triggers
     FormState.reset() via the Form component's onreset handler. -->
<Button
  type="reset"
  variant="secondary"
  disabled={!state.isDirty || state.isSubmitting}
  title={children ? resolvedLabel : undefined}
  class={classes}
>
  {#if children}
    {@render children()}
    <span class="sr-only">{resolvedLabel}</span>
  {:else}
    {resolvedLabel}
  {/if}
</Button>
