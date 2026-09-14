<script lang="ts">
  import { Page } from "@privaty/ui-layouts";
  import type { LayoutProps } from "./$types";

  const { children }: LayoutProps = $props();
</script>

<!-- Every demo page shares one Page tile in the DOCUMENT stance: it
     grows with the demo and the page scrolls. Full-bleed demos (tiles,
     the layouts mini-app) reset past this layout AND the site chrome
     with `@` and scaffold the bare viewport themselves. -->
<Page flow label="Sandbox">
  {@render children()}
</Page>
