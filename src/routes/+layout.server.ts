import { parseTheme } from "#lib/enums/theme.js";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies }) => {
  return {
    theme: parseTheme(cookies.get("theme-preference")),
  };
};
