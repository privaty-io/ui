<!-- @component
One pane of a tiled page — a `<section>` on the tile surface with the two
quiet state cues: hovering warms its border a half-step, and focus within
marks it as the section the keyboard is in (one tile at a time, page-wide).
Give it a `label` so the landmark reads properly; `still` opts a purely
decorative tile out of the state cues. Sits on a `TileCanvas` (or any
canvas-colored surface with tight gaps) — the canvas showing through the
gutters is what makes the panes read.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "../../cn/cn";
  import { coreTheme } from "../../theme";

  interface Props extends HTMLAttributes<HTMLElement> {
    children: Snippet;
    /** Accessible name for the section landmark — screen-reader users get
     * the same "which section am I in" answer the focus cue gives
     * sighted users. */
    label?: string;
    /** Opts this tile out of the hover/focus-within cues — for purely
     * decorative or status panes that never hold focus. */
    still?: boolean;
    /** Removes the default content padding (an edge-to-edge table or
     * image manages its own inset). */
    flush?: boolean;
    /** Extra classes for the tile. */
    class?: string;
  }

  const {
    children,
    label,
    still = false,
    flush = false,
    class: classes,
    ...rest
  }: Props = $props();
</script>

<section
  {...rest}
  aria-label={label}
  class={cn(
    coreTheme.tiles.tile,
    !still && coreTheme.tiles.tileInteractive,
    !flush && coreTheme.tiles.tilePadding,
    classes,
  )}
>
  {@render children()}
</section>
