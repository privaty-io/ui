<!-- @component
INTERNAL. Scopes the nav context to the nav pane's subtree: context can
only be set for a component's whole subtree, and SidebarPage setting it
directly would put its MAIN content's nav pieces into compact mode too.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { setNavContext } from "../nav/context";

  interface Props {
    /** Reactive getter for the compact state. */
    compact: () => boolean;
    children: Snippet;
  }

  const { compact, children }: Props = $props();

  setNavContext({
    get compact() {
      return compact();
    },
  });
</script>

{@render children()}
