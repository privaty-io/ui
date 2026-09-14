<!-- @component
The centered-tile page scaffold: a single card centered in whatever
space the layout leaves — sign-in screens, small settings, error pages.
Canvas-transparent like every scaffold (the Frame or a TileCanvas
behind provides the ground). `title` renders a TileTitle in the card,
`width` caps it, `footer` is the quiet line under it.
-->
<script lang="ts" module>
  /** The card's width cap. */
  export type CenteredPageWidth = "xs" | "sm" | "md" | "lg";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn, Tile, TileTitle } from "@privaty/ui";
  import { layoutsTheme } from "./theme";

  interface Props {
    /** The card's content. */
    children: Snippet;
    /** Heading rendered as the card's TileTitle. */
    title?: string;
    /** Accessible name for the card's landmark — defaults to `title`. */
    label?: string;
    /** The card's width cap. */
    width?: CenteredPageWidth;
    /** Quiet line under the card. */
    footer?: Snippet;
    /** Extra classes for the scaffold root. */
    class?: string;
  }

  const {
    children,
    title,
    label,
    width = "sm",
    footer,
    class: classes,
  }: Props = $props();

  const widthClasses: Record<CenteredPageWidth, string> = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };
</script>

<div class={cn(layoutsTheme.pageRoot, layoutsTheme.centered.root, classes)}>
  <div class={cn(layoutsTheme.centered.frame, widthClasses[width])}>
    <Tile label={label ?? title} class={layoutsTheme.centered.panel}>
      {#if title}
        <TileTitle {title} />
      {/if}
      {@render children()}
    </Tile>
    {#if footer}
      <div class={layoutsTheme.centered.footer}>{@render footer()}</div>
    {/if}
  </div>
</div>
