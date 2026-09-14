<!-- @component
The generic footer: a tile row of quiet fine print — `children` on the
left, an `end` snippet docked right (keyboard hints, a version).
Root-layout furniture like Header; doubles as an app's status bar (a
section can carry its own with a distinct `label`). A regular
interactive tile: it warms under the pointer like every other pane,
and the focus cue applies when it holds links or buttons.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn, Tile } from "@privaty/ui";
  import { layoutsTheme } from "./theme";

  interface Props {
    /** Left-aligned content. */
    children?: Snippet;
    /** Content docked to the row's end. */
    end?: Snippet;
    /** Accessible name for the footer's landmark. */
    label?: string;
    /** Extra classes for the tile row. */
    class?: string;
  }

  const { children, end, label = "Footer", class: classes }: Props = $props();
</script>

<Tile {label} class={cn(layoutsTheme.footer.root, classes)}>
  {@render children?.()}
  {#if end}
    <div class={layoutsTheme.footer.end}>{@render end()}</div>
  {/if}
</Tile>
