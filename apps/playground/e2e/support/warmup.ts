import { chromium } from "@playwright/test";
import type { FullConfig } from "@playwright/test";

/**
 * Warms the dev server before any test runs: the first real browsing
 * after a cold start makes Vite discover and re-optimize dependencies,
 * which invalidates in-flight module URLs — Chromium recovers silently,
 * Firefox surfaces "error loading dynamically imported module" page
 * errors that would (rightly) trip the console guard. One throwaway
 * browsing pass absorbs all of that.
 */
const pages = [
  "/",
  "/app",
  "/app/inventory",
  "/app/deliveries",
  "/app/suppliers",
  "/sandbox",
];

export default async function warmup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL;
  if (!baseURL) return;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const path of pages) {
    await page.goto(baseURL + path, { waitUntil: "networkidle" }).catch(() => {
      // Cold-start hiccups are exactly what this pass is here to absorb.
    });
  }
  // Client-side navigation loads route modules full page loads never
  // touch — exercise it too, or the first SPA nav in a test re-triggers
  // dependency discovery.
  await page
    .goto(baseURL + "/app", { waitUntil: "networkidle" })
    .catch(() => {});
  for (const label of ["Inventory", "Deliveries", "Suppliers"]) {
    await page
      .getByRole("link", { name: label })
      .first()
      .click()
      .catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
  }
  await browser.close();
}
