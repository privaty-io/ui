<script lang="ts">
  import { Theme } from "#lib/enums/theme.js";
  import { themeStore } from "#lib/stores/theme.svelte.js";
  import { cn } from "@privaty/ui/cn.js";
  import {
    MoonIcon,
    SunIcon,
    SunMoonIcon,
    type LucideProps,
  } from "@lucide/svelte";
  import type { Component } from "svelte";

  type ThemeItem = {
    name: string;
    theme: Theme;
    Icon: Component<LucideProps>;
    iconClass: string;
  };

  const themes: ThemeItem[] = [
    {
      name: "System",
      theme: Theme.System,
      Icon: SunMoonIcon,
      iconClass: cn("hidden theme-system:block"),
    },
    {
      name: "Light",
      theme: Theme.Light,
      Icon: SunIcon,
      iconClass: cn("hidden theme-light:block"),
    },
    {
      name: "Dark",
      theme: Theme.Dark,
      Icon: MoonIcon,
      iconClass: cn("hidden theme-dark:block"),
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
  title={`Switch theme (current: ${current.name})`}
  aria-label={`Switch theme (current: ${current.name})`}
>
  {#each themes as item (item.theme)}
    <item.Icon class={item.iconClass} />
  {/each}
</button>
