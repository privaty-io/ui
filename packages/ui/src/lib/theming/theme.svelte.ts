/**
 * The theme preference store — the single client-side source of truth
 * for "system" | "light" | "dark". ThemeProvider applies it to the
 * document (and persists it); ThemeToggle cycles it; app code may read
 * or set `theme.preference` directly.
 */

/** The user's stated preference — "system" means "follow the OS". */
type ThemePreference = "system" | "light" | "dark";

/** Cycle order for toggles: system → light → dark → system. */
const themePreferences: readonly ThemePreference[] = [
  "system",
  "light",
  "dark",
];

/** The cookie the whole system agrees on by default — the init script,
 * the SSR hook helper, and ThemeProvider's persistence. */
const defaultThemeCookie = "theme-preference";

/** Anything that isn't exactly "light" or "dark" is "system". */
function parseThemePreference(
  value: string | undefined | null,
): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

/** Reads the preference cookie — "system" when absent (or on the server,
 * where the SSR hook helper is the cookie reader instead). */
function readThemeCookie(
  cookieName: string = defaultThemeCookie,
): ThemePreference {
  if (typeof document === "undefined") return "system";
  return parseThemePreference(
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${cookieName}=`))
      ?.split("=")[1],
  );
}

/** The store. Initialized from the default cookie in the browser (before
 * any component renders); ThemeProvider re-reads when given a custom
 * cookie name. */
const theme = $state<{ preference: ThemePreference }>({
  preference: readThemeCookie(),
});

export {
  defaultThemeCookie,
  parseThemePreference,
  readThemeCookie,
  theme,
  themePreferences,
};
export type { ThemePreference };
