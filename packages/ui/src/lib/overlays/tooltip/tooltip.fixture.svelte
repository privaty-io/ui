<script lang="ts">
  // Test-only host: a Tooltip on a button, delay controllable per spec.
  import Tooltip from "./tooltip.svelte";

  interface Props {
    openDelay?: number;
  }

  const { openDelay = 0 }: Props = $props();
</script>

<button data-testid="outside" style="display: block; margin-bottom: 100px;">
  Outside
</button>

<Tooltip {openDelay} placement="top" offset={4}>
  {#snippet trigger(props)}
    <button {...props} data-testid="trigger">Hover me</button>
  {/snippet}
  Helpful hint
</Tooltip>
