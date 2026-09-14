<!-- @component
The column an application lives in: a TileCanvas laid out as a
full-height flex column. Root-layout furniture (`Header`, `Footer`) and
the route's page scaffold go in as plain children — the bars keep their
natural height and the page scaffold (which defaults to `flex-1`) takes
the rest. Fills its container; give the outermost one a viewport
height — `min-h-svh` is the versatile choice: document-flow pages
(Page `flow`) grow the column so the page scrolls, while viewport
scaffolds still pin to one screen.

The Frame is the only canvas the layouts own — every part and scaffold
is canvas-transparent, so nesting never doubles gutters or padding.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn, TileCanvas } from "@privaty/ui";

  interface Props {
    children: Snippet;
    /** Extra classes for the canvas column. */
    class?: string;
  }

  const { children, class: classes }: Props = $props();
</script>

<TileCanvas class={cn("flex h-full flex-col", classes)}>
  {@render children()}
</TileCanvas>
