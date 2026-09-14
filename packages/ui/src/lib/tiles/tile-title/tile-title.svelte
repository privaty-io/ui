<!-- @component
A tile's pane-title row: the section name on the left, an optional
`actions` snippet docked right — the consistent header that makes a page
of tiles read as one system (the VS Code pane-title look). Renders an
`<h2>`; put it first inside a Tile.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../../cn/cn";
  import { coreTheme } from "../../theme";

  interface Props {
    /** The pane's visible name. */
    title: string;
    /** Controls docked to the row's end (icon buttons, a counter). */
    actions?: Snippet;
    /** Extra classes for the row. */
    class?: string;
  }

  const { title, actions, class: classes }: Props = $props();
</script>

<div class={cn(coreTheme.tiles.title, classes)}>
  <h2 class={coreTheme.tiles.titleText}>{title}</h2>
  {#if actions}
    <div class={coreTheme.tiles.titleActions}>{@render actions()}</div>
  {/if}
</div>
