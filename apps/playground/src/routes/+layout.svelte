<script lang="ts">
  import "#lib/assets/styles/app.css";
  import "#lib/assets/styles/fonts.css";
  import Header from "#lib/components/layout/header.svelte";
  import { ThemeProvider } from "@privaty/ui";
  import type { LayoutProps } from "./$types";

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <title>Privaty/ui</title>
</svelte:head>

<ThemeProvider />
<Header />

<div class="flex flex-col justify-center py-8">
  {@render children()}
</div>
