import type { Handle } from "@sveltejs/kit/hooks";
import { parseTheme, Theme } from "#lib/enums/theme.js";

export const themeServerHook: Handle = async ({ event, resolve }) => {
  const themePreference = parseTheme(event.cookies.get("theme-preference"));

  return await resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace(
        "%theme-preference%",
        themePreference === Theme.System
          ? ""
          : `data-theme="${themePreference}"`,
      ),
  });
};
