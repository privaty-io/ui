import { headersServerHook } from "$lib/server/hooks/headers";
import { preloadServerHook } from "$lib/server/hooks/preload";
import { themeServerHook } from "$lib/server/hooks/theme";
import { sequence } from "@sveltejs/kit/hooks";

export const handle = sequence(
  themeServerHook,
  headersServerHook,
  preloadServerHook,
);
