<script lang="ts">
  import { Theme } from "$lib/enums/theme";
  import { themeStore } from "$lib/stores/theme.svelte";
  import {
    MoonIcon,
    SunIcon,
    SunMoonIcon,
    type LucideProps,
  } from "@lucide/svelte";
  import { onMount, type Component } from "svelte";

  const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

  $effect(() => {
    if (themeStore.current != Theme.System) {
      document.documentElement.dataset.theme = themeStore.current;
      document.cookie = `theme-preference=${themeStore.current}; SameSite=Strict; Secure; Path=/; Max-Age=${ONE_YEAR_SECONDS}`;
    } else {
      document.documentElement.dataset.theme = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches
        ? Theme.Dark
        : Theme.Light;
      document.cookie =
        "theme-preference=; SameSite=Strict; Secure; Path=/; Max-Age=0";
    }
  });

  onMount(() => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (event) => {
        if (themeStore.current === Theme.System)
          document.documentElement.dataset.theme = event.matches
            ? Theme.Dark
            : Theme.Light;
      });
  });

  type ThemeItem = {
    name: string;
    theme: Theme;
    Icon: Component<LucideProps>;
  };

  const themes: ThemeItem[] = [
    {
      name: "System",
      theme: Theme.System,
      Icon: SunMoonIcon,
    },
    {
      name: "Light",
      theme: Theme.Light,
      Icon: SunIcon,
    },
    {
      name: "Dark",
      theme: Theme.Dark,
      Icon: MoonIcon,
    },
  ];

  const current = $derived(
    themes.find((item) => item.theme === themeStore.current) ?? themes[0],
  );

  function cycleTheme() {
    const index = themes.findIndex((item) => item.theme === themeStore.current);
    themeStore.current = themes[(index + 1) % themes.length].theme;
  }
</script>

<button
  class="block cursor-pointer"
  onclick={cycleTheme}
  title={current.name}
  aria-label={current.name}
>
  <current.Icon />
</button>
