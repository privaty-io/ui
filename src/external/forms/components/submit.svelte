<script lang="ts">
  import Button from "@privaty/ui/components/button.svelte";
  import { getFormContext } from "../context";

  interface Props {
    label: string;
    submittingLabel?: string;

    disabledUntil?: "dirty-and-valid" | "valid" | "none";

    class?: string;
  }

  const {
    label,
    submittingLabel,

    disabledUntil = "dirty-and-valid",

    class: classes,
  }: Props = $props();

  const { state } = getFormContext();

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
  class={classes}
>
  {#if submittingLabel && state.isSubmitting}
    {submittingLabel}…
  {:else}
    {label}
  {/if}
</Button>
