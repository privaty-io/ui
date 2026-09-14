import type { Handle } from "@sveltejs/kit/hooks";
import {
  defaultThemeCookie,
  parseThemePreference,
  themeHtmlAttributes,
} from "@privaty/ui";

// SSR half of FOUC-free theming: the first byte of HTML already carries
// the right attributes (see @privaty/ui's theming/theme-ssr.ts).
export const themeServerHook: Handle = async ({ event, resolve }) => {
  const preference = parseThemePreference(
    event.cookies.get(defaultThemeCookie),
  );

  return await resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace("%theme-preference%", themeHtmlAttributes(preference)),
  });
};
