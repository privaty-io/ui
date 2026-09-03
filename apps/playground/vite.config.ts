import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // Crawl every route at startup so dependency discovery happens BEFORE
  // any browser connects: a mid-session re-optimization invalidates
  // in-flight module URLs, which Firefox surfaces as dynamic-import page
  // errors — flakiness the e2e console guard would (rightly) fail on.
  server: {
    warmup: {
      clientFiles: ["./src/routes/**/*.svelte", "./src/lib/**/*.ts"],
    },
  },
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
        experimental: { async: true },
      },
      adapter: adapter(),
      experimental: {
        remoteFunctions: true,
      },
    }),
  ],
});
