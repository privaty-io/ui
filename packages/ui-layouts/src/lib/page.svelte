<!-- @component
The plain page scaffold: one main Tile in whatever space the
surrounding layout leaves (a Frame's leftover column, a bounded
container). Two scroll stances: by default the tile pins to the
viewport space and its content scrolls INSIDE (the app stance); with
`flow` the tile grows with its content and the PAGE scrolls — the
document stance, for content that should simply run down the page
(pair it with a growing Frame, `min-h-svh`). Pass `bare` to take the
space raw and bring your own tiles — the canvas behind shows through.
No header/footer knowledge: those are root-layout furniture; this is
what a route renders.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn, Tile } from "@privaty/ui";
  import { layoutsTheme } from "./theme";

  interface Props {
    children: Snippet;
    /** Render children directly into the space instead of wrapping them
     * in a Tile — for pages that bring their own pane tree. */
    bare?: boolean;
    /** Document stance: grow with the content and let the page scroll,
     * instead of pinning to the viewport and scrolling inside. */
    flow?: boolean;
    /** Accessible name for the main tile's landmark. */
    label?: string;
    /** Extra classes for the scaffold root. */
    class?: string;
  }

  const {
    children,
    bare = false,
    flow = false,
    label = "Content",
    class: classes,
  }: Props = $props();

  const sizing = $derived(
    flow
      ? layoutsTheme.pageFlow
      : cn(layoutsTheme.pageRoot, !bare && layoutsTheme.page.main),
  );
</script>

{#if bare}
  <div class={cn(sizing, classes)}>
    {@render children()}
  </div>
{:else}
  <Tile {label} class={cn(sizing, classes)}>
    {@render children()}
  </Tile>
{/if}
