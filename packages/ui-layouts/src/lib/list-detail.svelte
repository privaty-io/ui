<!-- @component
The master–detail page scaffold: a sized, resizable `list` pane and a
`detail` pane taking the remainder — both labeled, scrolling Tiles on a
TileSplit. A page scaffold in its own right: drop it into a Frame's
column or a SidebarPage's bare track; canvas-transparent like every
scaffold.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn, Tile, TileSplit } from "@privaty/ui";
  import { layoutsTheme } from "./theme";

  interface Props {
    /** The list pane's content (the rows to pick from). */
    list: Snippet;
    /** The detail pane's content (the picked row, at length). */
    detail: Snippet;

    /** Accessible names for the two panes and their gutter. */
    listLabel?: string;
    detailLabel?: string;
    resizeLabel?: string;

    /** Current list width (px) — bindable for persistence. */
    size?: number;
    /** Starting list width, and the gutter's double-click reset target. */
    initial?: number;
    min?: number;
    max?: number;
    /** Whether dragging well past `min` snaps the list pane closed. */
    collapsible?: boolean;

    /** Extra classes for the split container. */
    class?: string;
  }

  let {
    list,
    detail,
    listLabel = "List",
    detailLabel = "Detail",
    resizeLabel = "Resize list",
    initial = 280,
    size = $bindable(initial),
    min = 200,
    max = 440,
    collapsible = false,
    class: classes,
  }: Props = $props();
</script>

<TileSplit
  class={cn(layoutsTheme.pageRoot, classes)}
  bind:size
  {initial}
  {min}
  {max}
  {collapsible}
  label={resizeLabel}
>
  {#snippet start()}
    <Tile label={listLabel} class={layoutsTheme.listDetail.pane}>
      {@render list()}
    </Tile>
  {/snippet}
  {#snippet end()}
    <Tile label={detailLabel} class={layoutsTheme.listDetail.pane}>
      {@render detail()}
    </Tile>
  {/snippet}
</TileSplit>
