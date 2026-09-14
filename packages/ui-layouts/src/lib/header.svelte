<!-- @component
The generic header: a tile row with a brand block (title plus a quiet
subtitle, or a `brand` snippet for a logo), free `children` in the
middle (a `HeaderNav`, a search field), and an `actions` snippet docked
to the end — `themeToggle` drops the core ThemeToggle into that dock.
Root-layout furniture: put it in a Frame above the page scaffolds; a
section can carry a second one.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn, ThemeToggle, Tile } from "@privaty/ui";
  import { layoutsTheme } from "./theme";

  interface Props {
    /** The product/section name. */
    title?: string;
    /** Quiet line beside the title. */
    subtitle?: string;
    /** Replaces the title/subtitle brand block (a logo, a home link). */
    brand?: Snippet;
    /** Free content after the brand. */
    children?: Snippet;
    /** Controls docked to the row's end. */
    actions?: Snippet;
    /** Appends the core ThemeToggle to the end dock. */
    themeToggle?: boolean;
    /** Accessible name for the header's landmark. */
    label?: string;
    /** Extra classes for the tile row. */
    class?: string;
  }

  const {
    title,
    subtitle,
    brand,
    children,
    actions,
    themeToggle = false,
    label = "Header",
    class: classes,
  }: Props = $props();
</script>

<Tile {label} class={cn(layoutsTheme.header.root, classes)}>
  {#if brand}
    {@render brand()}
  {:else if title !== undefined}
    <div class={layoutsTheme.header.brand}>
      <span class={layoutsTheme.header.title}>{title}</span>
      {#if subtitle}
        <span class={layoutsTheme.header.subtitle}>{subtitle}</span>
      {/if}
    </div>
  {/if}
  {@render children?.()}
  {#if actions || themeToggle}
    <div class={layoutsTheme.header.actions}>
      {@render actions?.()}
      {#if themeToggle}
        <ThemeToggle />
      {/if}
    </div>
  {/if}
</Tile>
