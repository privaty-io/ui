<script lang="ts">
  import "$lib/assets/styles/app.css";
  import "$lib/assets/styles/fonts.css";
  import Header from "$lib/components/layout/header.svelte";
  import { themeStore } from "$lib/stores/theme.svelte";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  // svelte-ignore state_referenced_locally
  themeStore.current = data.theme;
</script>

<svelte:head>
  <title>Privaty/ui</title>
</svelte:head>

<Header />

<div class="flex flex-col justify-center py-8">
  {@render children()}
</div>
