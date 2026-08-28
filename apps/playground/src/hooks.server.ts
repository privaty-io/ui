import { headersServerHook } from "#lib/server/hooks/headers.js";
import { preloadServerHook } from "#lib/server/hooks/preload.js";
import { themeServerHook } from "#lib/server/hooks/theme.js";
import { sequence } from "@sveltejs/kit/hooks";

export const handle = sequence(
  themeServerHook,
  headersServerHook,
  preloadServerHook,
);
