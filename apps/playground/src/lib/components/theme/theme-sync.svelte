<script lang="ts">
  import { Theme } from "#lib/enums/theme.js";
  import { themeStore } from "#lib/stores/theme.svelte.js";
  import { MediaQuery } from "svelte/reactivity";

  const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

  const prefersDark = new MediaQuery("(prefers-color-scheme: dark)");

  const resolvedTheme = $derived(
    themeStore.current === Theme.System
      ? prefersDark.current
        ? Theme.Dark
        : Theme.Light
      : themeStore.current,
  );

  $effect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.themePreference = themeStore.current;

    document.cookie =
      themeStore.current === Theme.System
        ? "theme-preference=; SameSite=Strict; Secure; Path=/; Max-Age=0"
        : `theme-preference=${themeStore.current}; SameSite=Strict; Secure; Path=/; Max-Age=${ONE_YEAR_SECONDS}`;
  });
</script>
