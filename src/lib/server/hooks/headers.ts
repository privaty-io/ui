import type { Handle } from "@sveltejs/kit";

export const headersServerHook: Handle = async ({ event, resolve }) => {
  event.setHeaders({
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  return await resolve(event);
};
