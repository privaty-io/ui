import { settle } from "./support/helpers";
import { expect, test } from "./support/test";

// The console sweep: every app page must load AND hydrate clean on a
// fresh visit — the guard fixture fails the test on any console error,
// page error, or hydration warning without a single explicit assert.
const pages = [
  { path: "/", heading: "Welcome to Privaty/ui" },
  { path: "/app", heading: "Back office" },
  { path: "/app/inventory", heading: "Inventory" },
  { path: "/app/deliveries", heading: "Deliveries" },
  { path: "/app/suppliers", heading: "Suppliers" },
];

for (const { path, heading } of pages) {
  test(`${path} loads clean`, async ({ page }) => {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
    // Let late async boundaries, measurements, and re-anchors settle so
    // the guard hears anything they shout.
    await page.waitForTimeout(1000);
  });
}

test("client-side navigation across the app stays clean", async ({ page }) => {
  await page.goto("/app");
  await settle(page);
  for (const link of ["Inventory", "Deliveries", "Suppliers"]) {
    await page.getByRole("link", { name: link }).first().click();
    await expect(
      page.getByRole("heading", { level: 1, name: link }),
    ).toBeVisible();
    // Settle BEFORE the next navigation — an interrupted route load makes
    // Firefox report aborted lazy imports as page errors (see helpers).
    await settle(page);
  }
});
