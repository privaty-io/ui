<!-- @component
The side-nav page scaffold: a collapsible navigation pane beside the
main content, both labeled Tiles on a draggable, keyboard-resizable
TileSplit. Fills whatever space the surrounding layout leaves (a
Frame's leftover column); canvas-transparent like every scaffold.

The nav never disappears — it collapses to a COMPACT icon rail
(`navCompact` px): drag hard past `navMin`, press Home on the gutter,
or call the toggle. While compact, the nav context flips and NavItems
inside show icon-only (labels stay as accessible names). The `nav`
snippet receives `{ navCollapsed, toggleNav }` for an in-pane collapse
button, and `toggleNav()` is also exported on the component instance
(`bind:this`) for buttons living elsewhere. `children` render inside a
scrolling main Tile unless `bare`.
-->
<script lang="ts" module>
  /** What the `nav` snippet is handed — wire `toggleNav` to a button in
   * the pane for the familiar collapse affordance. */
  export interface SidebarNavContext {
    /** True while the nav is compact. */
    navCollapsed: boolean;
    /** Collapses the nav to the compact rail, or restores it to its
     * last open width. */
    toggleNav: () => void;
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn, Tile, TileSplit } from "@privaty/ui";
  import { layoutsTheme } from "../theme";
  import SidebarNavScope from "./sidebar-nav-scope.svelte";

  interface Props {
    /** The main content — wrapped in a scrolling Tile unless `bare`. */
    children: Snippet;
    /** The navigation pane's content (typically a NavList — see
     * SidebarNavContext). */
    nav: Snippet<[SidebarNavContext]>;

    /** Render `children` directly into the main track instead of
     * wrapping them in a Tile — for pages that bring their own pane
     * tree. Size it with `h-full`. */
    bare?: boolean;

    /** Starting nav width, and the gutter's double-click reset target. */
    navInitial?: number;
    /** Current nav width (px) — bindable for persistence. */
    navSize?: number;
    navMin?: number;
    navMax?: number;
    /** The compact rail width a collapse lands on. 0 hides the nav
     * entirely instead. */
    navCompact?: number;

    /** Accessible names for the panes and the gutter. */
    navLabel?: string;
    mainLabel?: string;
    resizeLabel?: string;

    /** Extra classes for the scaffold root. */
    class?: string;
  }

  let {
    children,
    nav,
    bare = false,
    navInitial = 230,
    navSize = $bindable(navInitial),
    navMin = 170,
    navMax = 360,
    navCompact = 48,
    navLabel = "Navigation",
    mainLabel = "Content",
    resizeLabel = "Resize navigation",
    class: classes,
  }: Props = $props();

  const collapsed = $derived(navSize <= navCompact);

  // The toggle restores the last width the nav was actually open at, so
  // a drag-tuned nav comes back at its tuned width — the initial only
  // serves until the nav has ever been open.
  // svelte-ignore state_referenced_locally
  let lastOpenNavSize = $state(navInitial);
  $effect(() => {
    if (navSize > navCompact) lastOpenNavSize = navSize;
  });

  export function toggleNav() {
    if (collapsed) {
      navSize = lastOpenNavSize;
    } else {
      // Captured here too, not only in the effect: effects flush in a
      // microtask, and a toggle in the same tick as a resize must not
      // restore to a stale width.
      lastOpenNavSize = navSize;
      navSize = navCompact;
    }
  }
  /** Whether the nav is currently compact. */
  export function navCollapsed() {
    return collapsed;
  }
</script>

<TileSplit
  class={cn(layoutsTheme.pageRoot, classes)}
  bind:size={navSize}
  initial={navInitial}
  min={navMin}
  max={navMax}
  collapsible
  collapsedSize={navCompact}
  label={resizeLabel}
>
  {#snippet start()}
    <Tile label={navLabel} class={layoutsTheme.sidebar.navPane}>
      <SidebarNavScope compact={() => collapsed}>
        {@render nav({ navCollapsed: collapsed, toggleNav })}
      </SidebarNavScope>
    </Tile>
  {/snippet}
  {#snippet end()}
    {#if bare}
      <div class="h-full min-w-0">
        {@render children()}
      </div>
    {:else}
      <Tile label={mainLabel} class={cn("h-full", layoutsTheme.page.main)}>
        {@render children()}
      </Tile>
    {/if}
  {/snippet}
</TileSplit>
