import type { Page } from "@playwright/test";

/**
 * Waits until the page has genuinely settled: network idle plus a beat
 * for late effects (measurements, re-anchors, async boundaries).
 *
 * ALWAYS settle before triggering a client-side navigation on top of a
 * previous one: Kit cancels the in-flight route's lazy imports, and
 * Firefox reports those aborts as page errors — which the console guard
 * treats as fatal on purpose (the same message signals genuinely broken
 * module loading, e.g. a stale client bundle).
 */
async function settle(page: Page, extraMs = 150): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(extraMs);
}

export { settle };
