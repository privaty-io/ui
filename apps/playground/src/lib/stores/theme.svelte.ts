import { Theme, parseTheme } from "#lib/enums/theme.js";
import { browser } from "$app/env";

type ThemeStore = {
  current: Theme;
};

const themeStore = $state<ThemeStore>({
  current: browser
    ? parseTheme(
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("theme-preference="))
          ?.split("=")[1],
      )
    : Theme.System,
});

export { themeStore };
