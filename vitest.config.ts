import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Specs across the whole workspace run from this single config. The packages
// have no Kit runtime dependency ($app imports are type-only, enforced by
// lint), so the plain Svelte plugin suffices — no SvelteKit project needed.
export default defineConfig({
  resolve: {
    // Kit's plugin resolves the app's package.json `imports` (#lib) itself;
    // plain Vite only honours the field of the project root. Mirror the
    // playground's mapping for its specs.
    alias: [
      {
        find: /^#lib\//,
        replacement: `${import.meta.dirname}/apps/playground/src/lib/`,
      },
      {
        find: "#lib",
        replacement: `${import.meta.dirname}/apps/playground/src/lib/index.js`,
      },
    ],
  },
  plugins: [
    tailwindcss(),
    // No preprocess: Svelte 5 parses lang="ts" natively, and the packages
    // use no compile-to-JS TS features (enums etc.) — same reason they ship
    // unpreprocessed and need no svelte.config.js.
    svelte({
      compilerOptions: {
        // Force runes mode for workspace code, but not for node_modules.
        // Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
        experimental: { async: true },
      },
    }),
  ],
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: "./vitest.config.ts",
        test: {
          name: "client",
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium", headless: true }],
          },
          include: ["packages/*/src/**/*.svelte.{test,spec}.{js,ts}"],
        },
      },

      {
        extends: "./vitest.config.ts",
        // Server-render specs import .svelte trees; svelte deps from
        // node_modules must be processed, not externalized to Node.
        ssr: { noExternal: ["@lucide/svelte"] },
        test: {
          name: "server",
          environment: "node",
          include: [
            "packages/*/src/**/*.{test,spec}.{js,ts}",
            "apps/*/src/**/*.{test,spec}.{js,ts}",
          ],
          exclude: ["**/*.svelte.{test,spec}.{js,ts}"],
        },
      },

      // The overlay layer exists BECAUSE of Firefox (no native month/week
      // pickers; the positioning engine covers for missing CSS anchor
      // positioning) — its specs run there too, scoped to keep CI lean.
      {
        extends: "./vitest.config.ts",
        test: {
          name: "overlays-firefox",
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "firefox", headless: true }],
          },
          include: [
            "packages/ui/src/lib/overlays/**/*.svelte.{test,spec}.{js,ts}",
            // Cross-browser scroll math burned us twice — the sandbox
            // replica runs in Firefox too.
            "packages/ui-tables/src/lib/table-sandbox-replica.svelte.test.ts",
          ],
        },
      },

      // The playground is a real SvelteKit app — its code may use $app
      // modules at runtime (the packages may not), so its browser specs run
      // on the app's own Kit-enabled Vite config.
      {
        extends: "./apps/playground/vite.config.ts",
        root: "./apps/playground",
        test: {
          name: "playground",
          expect: { requireAssertions: true },
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium", headless: true }],
          },
          include: ["src/**/*.svelte.{test,spec}.{js,ts}"],
        },
      },
    ],
  },
});
