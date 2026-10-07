import type { Page } from "@playwright/test";
import { settle } from "./support/helpers";
import { expect, test } from "./support/test";

// The filtering demo: FilterBar + server sorting share one query value;
// the server validates with the definition's schema and executes a
// hand-rolled array converter. The console guard rides along.

const dataRows = (page: Page) =>
  page.locator("tbody tr:not(:has(td[colspan]))");

async function openFilter(page: Page) {
  await page.goto("/sandbox/table-filter");
  await expect(
    page.getByRole("heading", { name: "Filtered table" }),
  ).toBeVisible();
  await settle(page);
  // The default preset state (hidden filtered out) has loaded.
  await expect(page.getByRole("cell", { name: "Comté 18mo" })).toBeVisible();
}

test("a chip round-trips: filtered rows come back from the server", async ({
  page,
}) => {
  await openFilter(page);
  await expect(dataRows(page)).toHaveCount(8);

  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await page.getByLabel("Field").selectOption("price");
  await page.getByLabel("Operator").selectOption("gte");
  await page.getByLabel("Value").fill("100");
  await page.getByRole("button", { name: "Apply" }).click();

  await expect(page.getByRole("cell", { name: "Vintage Port" })).toBeVisible();
  await expect(dataRows(page)).toHaveCount(2);

  // Removing the chip restores the unfiltered set.
  await page.getByRole("button", { name: /^Remove filter/ }).click();
  await expect(dataRows(page)).toHaveCount(8);
});

test("the supplier header sorts by the JOINED supplier name", async ({
  page,
}) => {
  await openFilter(page);

  const firstName = () =>
    page.locator("tbody tr:not(:has(td[colspan])) td").first().textContent();

  await page.getByRole("button", { name: "Supplier" }).click();
  // Ascending by supplier NAME: Bodega Ríos first → Rioja Reserva row.
  await expect.poll(firstName).toContain("Rioja Reserva");
  await expect(page.locator('th[aria-sort="ascending"]')).toContainText(
    "Supplier",
  );

  await page.getByRole("button", { name: "Supplier" }).click();
  // Descending: Fromagerie Petit first → Comté row.
  await expect.poll(firstName).toContain("Comté 18mo");
});

test("presets narrow and reveal through the same query", async ({ page }) => {
  await openFilter(page);

  await page.getByLabel("Category").selectOption("wine");
  await expect(dataRows(page)).toHaveCount(3);
  await expect(
    page.getByRole("cell", { name: "Comté 18mo" }),
  ).not.toBeVisible();

  // Show hidden reveals the staff wine too.
  await page.getByRole("button", { name: "Show hidden" }).click();
  await expect(page.getByRole("cell", { name: "Staff wine" })).toBeVisible();
  await expect(dataRows(page)).toHaveCount(4);
});

test("quick search filters; clear restores", async ({ page }) => {
  await openFilter(page);

  await page.getByPlaceholder("Search products…").fill("brie");
  await page.keyboard.press("Enter");
  await expect(dataRows(page)).toHaveCount(1);
  await expect(page.getByRole("cell", { name: "Brie de Meaux" })).toBeVisible();

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(dataRows(page)).toHaveCount(8);
});
