<!-- @component
A vertical `<nav>` landmark stacking NavItems, with an optional
`footer` docked to the bottom (signed-in state, a version line). Grows
to fill a flex column (SidebarPage's nav pane); a long item list
scrolls while the footer stays put. In a compact nav the footer hides —
there is no room for fine print on an icon rail.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "@privaty/ui";
  import { layoutsTheme } from "../theme";
  import { getNavContext } from "./context";

  interface Props {
    /** The nav entries (NavItems, dividers, section labels). */
    children: Snippet;
    /** Quiet line docked to the bottom of the pane. */
    footer?: Snippet;
    /** Accessible name for the landmark — worth setting when a page has
     * more than one `<nav>`. */
    label?: string;
    /** Extra classes for the landmark. */
    class?: string;
  }

  const { children, footer, label, class: classes }: Props = $props();

  const nav = getNavContext();
</script>

<nav aria-label={label} class={cn("flex min-h-0 grow flex-col", classes)}>
  <div class={layoutsTheme.nav.items}>
    {@render children()}
  </div>
  {#if footer && !nav.compact}
    <div class={layoutsTheme.nav.footer}>{@render footer()}</div>
  {/if}
</nav>
