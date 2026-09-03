import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./support/test";

// The nested batch tables inside expanded inventory rows: expansion,
// the hiddenFields productId linkage on nested create, nested editing,
// and the one-editor-per-table-tree rule.

// A product's DISPLAY row, filtered by an exact cell match: the
// expanded-content row carries the product name only inside its batches
// heading (not as a cell), so it never collides with this.
const productRow = (page: Page, name: string): Locator =>
  page.getByRole("row").filter({
    has: page.getByRole("cell", { name, exact: true }),
  });

// The SSR'd loading veil covers the table until hydration and the rows
// query land, so this click also serves as the "table is interactive"
// gate — Playwright retries while the veil intercepts pointer events.
const expandProduct = async (page: Page, name: string): Promise<void> => {
  await productRow(page, name)
    .getByRole("button", { name: "Expand row" })
    .click();
};

// Creates a batch through the nested table's editor. The editor's submit
// shares the "Add" label with the header trigger, but the trigger is
// disabled while the create editor is open — disabled:false singles the
// submit out (it enables once the draft is dirty and valid).
const createBatch = async (
  batches: Locator,
  code: string,
  size: number,
): Promise<void> => {
  await batches.getByRole("button", { name: "Add" }).click();
  await batches.getByRole("textbox", { name: "Code" }).fill(code);
  await batches.getByRole("spinbutton", { name: "Size" }).fill(String(size));
  await batches.getByRole("button", { name: "Add", disabled: false }).click();
  await expect(
    batches.getByRole("cell", { name: code, exact: true }),
  ).toBeVisible();
};

test("expanding rows reveals each product's own batches", async ({ page }) => {
  await page.goto("/app/inventory");

  await expandProduct(page, "Comté 18mo");
  const batches1 = page.getByTestId("batches-prod-1");
  await expect(batches1).toBeVisible();
  await expect(batches1.getByRole("cell", { name: "CT-2608" })).toBeVisible();
  await expect(batches1.getByRole("cell", { name: "CT-2611" })).toBeVisible();

  await expandProduct(page, "Rioja Reserva");
  const batches2 = page.getByTestId("batches-prod-2");
  await expect(batches2).toBeVisible();
  await expect(batches2.getByRole("cell", { name: "RJ-1102" })).toBeVisible();

  // "Own" means EXCLUSIVE: a batches query that ignored productId and
  // served every batch to every table would still show each code in its
  // home table, so assert the codes stay out of the sibling too.
  await expect(batches2.getByRole("cell", { name: "CT-2608" })).toHaveCount(0);
  await expect(batches2.getByRole("cell", { name: "CT-2611" })).toHaveCount(0);
  await expect(batches1.getByRole("cell", { name: "RJ-1102" })).toHaveCount(0);

  // Expansion is per row, not exclusive — both stay open.
  await expect(batches1.getByRole("cell", { name: "CT-2608" })).toBeVisible();
});

test("a nested create lands under its own product only", async ({ page }) => {
  const code = `LNK-${Date.now()}`;

  await page.goto("/app/inventory");
  await expandProduct(page, "Comté 18mo");
  await expandProduct(page, "Rioja Reserva");

  const batches1 = page.getByTestId("batches-prod-1");
  const batches2 = page.getByTestId("batches-prod-2");
  // Prove prod-2's table has loaded before asserting absence in it.
  await expect(batches2.getByRole("cell", { name: "RJ-1102" })).toBeVisible();

  await createBatch(batches1, code, 33);

  // The hiddenFields productId linkage: the batch belongs to prod-1 and
  // never leaks into the sibling table.
  await expect(
    batches1.getByRole("cell", { name: code, exact: true }),
  ).toBeVisible();
  await expect(
    batches2.getByRole("cell", { name: code, exact: true }),
  ).toHaveCount(0);
});

test("a nested edit saves the new size", async ({ page }) => {
  const code = `EDT-${Date.now()}`;

  await page.goto("/app/inventory");
  await expandProduct(page, "Comté 18mo");
  const batches1 = page.getByTestId("batches-prod-1");

  // Edit a batch this test created — never a shared seed.
  await createBatch(batches1, code, 5);

  const batchRow = batches1.getByRole("row").filter({
    has: page.getByRole("cell", { name: code, exact: true }),
  });
  await batchRow.getByRole("button", { name: "Edit" }).click();
  await batches1.getByRole("spinbutton", { name: "Size" }).fill("41");
  await batches1.getByRole("button", { name: "Save" }).click();

  // The editor closes on success and the display row shows the new size.
  await expect(batches1.getByRole("textbox", { name: "Code" })).toHaveCount(0);
  await expect(
    batchRow.getByRole("cell", { name: "41", exact: true }),
  ).toBeVisible();
});

test.describe("one editor per table tree", () => {
  // The refusal warning is DESIGNED library output for this flow —
  // allowlisted for this block only.
  test.use({ allowedMessages: [/Refused to open an editor/] });

  test("an outer editor closes nested editors and refuses nested opens", async ({
    page,
  }) => {
    // A private listener (independent of the guard) to assert the
    // refusal actually warned rather than silently doing nothing.
    const warnings: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "warning") warnings.push(message.text());
    });

    await page.goto("/app/inventory");
    await expandProduct(page, "Comté 18mo");
    const batches1 = page.getByTestId("batches-prod-1");

    const seedBatchRow = batches1.getByRole("row").filter({
      has: page.getByRole("cell", { name: "CT-2608", exact: true }),
    });

    // Open a NESTED editor first.
    await seedBatchRow.getByRole("button", { name: "Edit" }).click();
    const nestedCode = batches1.getByRole("textbox", { name: "Code" });
    await expect(nestedCode).toHaveValue("CT-2608");

    // Opening the OUTER editor closes the descendant editor.
    await productRow(page, "Comté 18mo")
      .getByRole("button", { name: "Edit" })
      .click();
    const outerName = page.getByRole("textbox", { name: "Name" });
    await expect(outerName).toHaveValue("Comté 18mo");
    await expect(nestedCode).toHaveCount(0);

    // While the ancestor edits, a nested open is REFUSED: it warns, no
    // nested editor appears, and the outer editor stays open.
    await batches1.getByRole("button", { name: "Add" }).click();
    await expect
      .poll(
        () =>
          warnings.filter((text) => text.includes("Refused to open an editor"))
            .length,
      )
      .toBeGreaterThan(0);
    await expect(nestedCode).toHaveCount(0);
    await expect(outerName).toHaveValue("Comté 18mo");

    // The refusal must not LATCH: cancel the ancestor and the same
    // nested open the library just refused succeeds — the "save or
    // cancel the outer editor first" contract in the warning itself.
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(outerName).toHaveCount(0);
    await seedBatchRow.getByRole("button", { name: "Edit" }).click();
    await expect(nestedCode).toHaveValue("CT-2608");

    // Leave the page clean for whatever runs next.
    await batches1.getByRole("button", { name: "Cancel" }).click();
    await expect(nestedCode).toHaveCount(0);
  });
});
