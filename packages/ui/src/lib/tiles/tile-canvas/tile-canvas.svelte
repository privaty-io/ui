<!-- @component
The surface a tiled page lives on. Paints the canvas color and provides
the tight gutters (as `gap`) that let it show through between tiles —
bring your own grid/flex classes for the actual arrangement:

```svelte
<TileCanvas class="grid h-full grid-cols-[220px_1fr] grid-rows-[auto_1fr]">
  <Tile class="col-span-2" label="Header">…</Tile>
  <Tile label="Navigation">…</Tile>
  <Tile label="Content">…</Tile>
</TileCanvas>
```
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "../../cn/cn";
  import { coreTheme } from "../../theme";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children: Snippet;
    /** Extra classes — typically the grid/flex arrangement. */
    class?: string;
  }

  const { children, class: classes, ...rest }: Props = $props();
</script>

<!-- min-h-0/min-w-0: a canvas is routinely a flex/grid child bounded only
     by leftover space — same shrink permission the table root carries. -->
<div
  {...rest}
  class={cn("min-h-0 min-w-0 gap-1.5 p-1.5", coreTheme.tiles.canvas, classes)}
>
  {@render children()}
</div>
