<!-- @component
The generic footer: a still tile row of quiet fine print — `children`
on the left, an `end` snippet docked right (keyboard hints, a version).
Root-layout furniture like Header; doubles as an app's status bar (a
section can carry its own with a distinct `label`). Still on purpose:
a footer never takes the focus cue.
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

<Tile still {label} class={cn(layoutsTheme.footer.root, classes)}>
  {@render children?.()}
  {#if end}
    <div class={layoutsTheme.footer.end}>{@render end()}</div>
  {/if}
</Tile>
