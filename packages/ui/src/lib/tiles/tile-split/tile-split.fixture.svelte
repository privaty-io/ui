<script lang="ts">
  import TileSplit from "./tile-split.svelte";

  interface Props {
    orientation?: "horizontal" | "vertical";
    sized?: "start" | "end";
    initial?: number;
    min?: number;
    max?: number;
    collapsible?: boolean;
  }

  const props: Props = $props();

  // The initial size is a spec parameter, captured once by design.
  // svelte-ignore state_referenced_locally
  let size = $state(props.initial ?? 240);
  export function currentSize() {
    return size;
  }
</script>

<div class="h-64 w-160">
  <TileSplit class="h-full" {...props} bind:size label="Resize test pane">
    {#snippet start()}
      <div data-testid="start-pane">start</div>
    {/snippet}
    {#snippet end()}
      <div data-testid="end-pane">end</div>
    {/snippet}
  </TileSplit>
</div>
