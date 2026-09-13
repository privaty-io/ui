<script lang="ts">
  // Test-only host: a Popover with an outside click target and an external
  // control exercising bind:open.
  import Popover from "./popover.svelte";

  let open = $state(false);
</script>

<button data-testid="outside" style="display: block; margin-bottom: 200px;">
  Outside
</button>

<button data-testid="external" onclick={() => (open = !open)}>
  External toggle
</button>

<Popover bind:open placement="bottom-start" offset={8}>
  {#snippet trigger(props)}
    <button {...props} data-testid="trigger">Open popover</button>
  {/snippet}
  <button data-testid="content">Inside the popover</button>
</Popover>

<p data-testid="state">{open ? "open" : "closed"}</p>
