import { defineConfig, devices } from "@playwright/test";

// E2E harness for the playground app — the libraries driven as a REAL app:
// SSR, hydration, navigation, and the state flows component tests cannot
// see. Runs against the DEV server on purpose: Svelte's hydration warnings
// are dev-only, and the console guard (e2e/support/test.ts) fails tests on
// them.
// An UNCOMMON default port on purpose: 4173/5173 are Vite defaults, and
// reuseExistingServer would happily adopt some unrelated project's server
// squatting there (it happened).
const port = Number(process.env.E2E_PORT ?? 43117);

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/support/warmup.ts",
  // The playground's remote functions keep their data in module-level
  // arrays — one shared mutable store per server. Tests therefore run
  // SERIALLY; parallel workers would race each other's mutations. Specs
  // must still be self-contained (create what they assert on, with
  // unique names) so any order passes.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  webServer: {
    command: `pnpm dev --port ${port}`,
    port,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
    timeout: 60_000,
  },
});
