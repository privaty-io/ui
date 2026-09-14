<!-- @component
One navigation entry — a ghost Link when `href` is given, a ghost
Button otherwise — styled as the nav look: blends into its surface
until hovered. `current` keeps the resting wash and sets `aria-current`,
so the active section reads for everyone. An optional `icon` snippet
sits before the text; in a compact nav (SidebarPage's collapsed icon
rail, via the nav context) the label turns screen-reader-only and the
icon centers — give icon-bearing items a `title` so pointer users get
the name too.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { Button, cn, Link } from "@privaty/ui";
  import { layoutsTheme } from "../theme";
  import { getNavContext } from "./context";

  interface Props {
    /** The entry's text — the accessible name in every state. */
    children: Snippet;
    /** Renders the entry as a Link to this target; omit for a Button. */
    href?: string;
    /** Marks the entry the user is currently in. */
    current?: boolean;
    /** Leading icon — what remains visible in a compact nav. */
    icon?: Snippet;
    /** Native tooltip (the label, usually) — the compact state's
     * pointer affordance. */
    title?: string;
    /** Click handler — the natural wiring for the Button form. */
    onclick?: (event: MouseEvent) => void;
    /** Extra classes for the entry. */
    class?: string;
  }

  const {
    children,
    href,
    current = false,
    icon,
    title,
    onclick,
    class: classes,
  }: Props = $props();

  const nav = getNavContext();

  const itemClasses = $derived(
    cn(
      layoutsTheme.nav.item,
      current && layoutsTheme.nav.itemCurrent,
      nav.compact && layoutsTheme.nav.itemCompact,
      classes,
    ),
  );
</script>

{#snippet content()}
  {@render icon?.()}
  <span class={nav.compact ? "sr-only" : undefined}>
    {@render children()}
  </span>
{/snippet}

{#if href !== undefined}
  <Link
    {href}
    variant="ghost"
    aria-current={current ? "page" : undefined}
    class={itemClasses}
    {title}
    {onclick}
  >
    {@render content()}
  </Link>
{:else}
  <Button
    type="button"
    variant="ghost"
    aria-current={current ? "true" : undefined}
    class={itemClasses}
    {title}
    {onclick}
  >
    {@render content()}
  </Button>
{/if}
