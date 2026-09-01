<script lang="ts">
  // Test-only host for the anchorTo attachment: an anchor inside a
  // scrollable container plus a floating element, all sizes fixed so specs
  // can assert exact geometry.
  import { anchorTo, type AnchorToOptions } from "./position";

  interface Props {
    options?: AnchorToOptions;
    /** Renders the floating element with the popover attribute (shown via
     * showPopover() by the spec) instead of a plain block. */
    asPopover?: boolean;
    floatingWidth?: number;
    floatingHeight?: number;
  }

  const {
    options = {},
    asPopover = false,
    floatingWidth = 120,
    floatingHeight = 60,
  }: Props = $props();

  let anchor = $state<HTMLButtonElement>();
</script>

<div
  data-testid="scroller"
  style="height: 300px; overflow: auto; position: relative;"
>
  <div style="height: 200px"></div>
  <button
    bind:this={anchor}
    data-testid="anchor"
    style="display: block; width: 100px; height: 40px; margin-left: 150px;"
  >
    Anchor
  </button>
  <div style="height: 600px"></div>
</div>

{#if asPopover}
  <!-- border/padding zeroed: the [popover] UA styles add both, and without
       a border-box reset they'd inflate the rect the spec measures. -->
  <div
    popover="manual"
    data-testid="floating"
    {@attach anchorTo(anchor, options)}
    style="width: {floatingWidth}px; height: {floatingHeight}px; border: 0; padding: 0;"
  >
    Floating
  </div>
{:else}
  <div
    data-testid="floating"
    {@attach anchorTo(anchor, options)}
    style="width: {floatingWidth}px; height: {floatingHeight}px;"
  >
    Floating
  </div>
{/if}
