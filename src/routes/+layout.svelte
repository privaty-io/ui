<script lang="ts">
  import "#lib/assets/styles/app.css";
  import "#lib/assets/styles/fonts.css";
  import Header from "#lib/components/layout/header.svelte";
  import ThemeSync from "#lib/components/theme/theme-sync.svelte";
  import type { LayoutProps } from "./$types";

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <title>Privaty/ui</title>
</svelte:head>

<ThemeSync />
<Header />

<div class="flex flex-col justify-center py-8">
  {@render children()}
</div>
