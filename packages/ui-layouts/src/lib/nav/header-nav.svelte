<!-- @component
A horizontal `<nav>` run of NavItems for a header's middle — the
top-nav pattern. Same items, same `current` semantics as the vertical
NavList; only the axis differs. (A menu-style nav with dropdowns is a
later addition, once core has menu components.)
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "@privaty/ui";
  import { layoutsTheme } from "../theme";

  interface Props {
    /** The nav entries (NavItems). */
    children: Snippet;
    /** Accessible name for the landmark — worth setting when a page has
     * more than one `<nav>`. */
    label?: string;
    /** Extra classes for the landmark. */
    class?: string;
  }

  const { children, label, class: classes }: Props = $props();
</script>

<nav aria-label={label} class={cn(layoutsTheme.nav.headerNav, classes)}>
  {@render children()}
</nav>
