import type { Handle } from "@sveltejs/kit";

export const preloadServerHook: Handle = async ({ event, resolve }) => {
  return await resolve(event, {
    preload: ({ type, path }) => {
      const fontFiles = ["inter-latin-wght-normal"];

      switch (type) {
        case "font":
          return !!fontFiles.find((value) => path.includes(value));
        case "css":
        case "js":
          return true;
        default:
          return false;
      }
    },
  });
};
