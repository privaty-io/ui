<script lang="ts">
  // The root layout is ONLY the Frame — a root layout can never be
  // reset away, so the site chrome (Header/Footer) lives in the (site)
  // group instead: full-bleed demos reset past it with `@` and get the
  // bare viewport column.
  import "#lib/assets/styles/app.css";
  import "#lib/assets/styles/fonts.css";
  import { ThemeProvider } from "@privaty/ui";
  import { Frame } from "@privaty/ui-layouts";
  import type { LayoutProps } from "./$types";

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <title>Privaty/ui</title>
</svelte:head>

<ThemeProvider />

<!-- min-h-svh, not h-svh: document-flow pages (Page `flow`) grow the
     column so the page scrolls; viewport scaffolds still pin to one
     screen. -->
<Frame class="min-h-svh">
  {@render children()}
</Frame>
