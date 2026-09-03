import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";

// The inventory table's EDIT side: the create editor row (guarded empty
// submission, raw "required" validation codes, the date-picker popover),
// the async category select with "No category" as a real choice, per-row
// edit/cancel/save, the one-open-editor rule, and deleting a row.
//
// Every test creates the rows it mutates (unique names) and never touches
// the seed rows beyond opening-and-cancelling an editor, so the tests pass
// in any order on the shared in-memory server data.

// Column order in a product row: [expander, Name, Category, Price, Stock,
// Restocked, actions] — cell-index assertions instead of substring checks,
// because the Date.now() suffix in row names can contain any digit pair.
const CELL = { name: 1, category: 2, price: 3, stock: 4, restocked: 5 };

/**
 * Loads /app/inventory and waits until the client rows query has filled
 * the table in — which also proves hydration finished, so the toolbar
 * buttons are live.
 */
async function openInventory(page: Page): Promise<void> {
  await page.goto("/app/inventory");
  await expect(productRow(page, "Comté 18mo")).toBeVisible();
}

/** The open editor row — the only tr containing the Name textbox. */
function editorRow(page: Page) {
  return page
    .getByRole("row")
    .filter({ has: page.getByRole("textbox", { name: "Name" }) });
}

function productRow(page: Page, name: string) {
  return page.getByRole("row").filter({ hasText: name });
}

/**
 * Day 15 of the current month — always present in the picker's default
 * (current-month) view, so picking it needs no calendar navigation.
 */
function currentMonth15(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}-15`;
}

/**
 * Creates a product through the editor row and returns its display row.
 * The date is typed (works in every browser); the picker popover itself
 * is exercised by the dedicated create test.
 */
async function createProduct(
  page: Page,
  name: string,
  options: { price?: string; stock?: string; category?: string } = {},
) {
  const { price = "40", stock = "5", category } = options;

  await page.getByRole("button", { name: "New product" }).click();
  const editor = editorRow(page);
  await expect(editor).toBeVisible();

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Price").fill(price);
  // exact: a substring match would also hit "Restocked".
  await page.getByLabel("Stock", { exact: true }).fill(stock);
  await page.getByLabel("Restocked").fill("2026-08-15");
  // The category select mounts only once its awaited remote options land
  // (the cell shows a spinner until then) — wait for it even when leaving
  // it empty, so the submit never races the editor cell's async boundary.
  await expect(page.getByLabel("Category")).toBeVisible();
  if (category !== undefined) {
    await page.getByLabel("Category").selectOption({ label: category });
  }

  await editor.getByRole("button", { name: "Add" }).click();

  // The row lands after the single-flight refresh (the veil may flash).
  const row = productRow(page, name);
  await expect(row).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Name" })).toHaveCount(0);
  return row;
}

test("an empty create submission is blocked and shows raw 'required' codes", async ({
  page,
}) => {
  await openInventory(page);

  await page.getByRole("button", { name: "New product" }).click();
  const editor = editorRow(page);
  await expect(editor).toBeVisible();

  // The editor's submit is gated until the draft is dirty AND valid — the
  // empty-submission guard. Enter must not sneak past it either: the
  // form's only submit button is disabled, so implicit submission is a
  // no-op and the editor stays open.
  const add = editor.getByRole("button", { name: "Add" });
  await expect(add).toBeDisabled();
  await page.getByLabel("Name").press("Enter");
  await expect(editor).toBeVisible();
  await expect(add).toBeDisabled();
  // …and no submission was even ATTEMPTED: an attempted-but-invalid submit
  // would have revealed every field's "required" code at once. (The two
  // round-trip assertions above give a stray reveal time to render.)
  await expect(editor.getByText("required", { exact: true })).toHaveCount(0);

  // Touch a field and empty it again: its issue reveals as the schema's
  // raw code — this page installs no custom messages, so "required"
  // resolves to itself.
  await page.getByLabel("Name").fill("x");
  await page.getByLabel("Name").fill("");
  const nameCell = editor
    .locator("td")
    .filter({ has: page.getByRole("textbox", { name: "Name" }) });
  await expect(nameCell.getByText("required", { exact: true })).toBeVisible();

  await page.getByLabel("Price").fill("5");
  await page.getByLabel("Price").fill("");
  const priceCell = editor
    .locator("td")
    .filter({ has: page.getByRole("spinbutton", { name: "Price" }) });
  await expect(priceCell.getByText("required", { exact: true })).toBeVisible();

  // Still nothing submittable.
  await expect(add).toBeDisabled();

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(editor).toHaveCount(0);
});

test("creates a product through the editor row", async ({
  page,
  browserName,
}) => {
  await openInventory(page);

  const name = `E2E Cheddar ${Date.now()}`;
  const iso = currentMonth15();

  await page.getByRole("button", { name: "New product" }).click();
  const editor = editorRow(page);
  await expect(editor).toBeVisible();

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Price").fill("63");
  // exact: a substring match would also hit "Restocked".
  await page.getByLabel("Stock", { exact: true }).fill("8");
  // Options arrive async — selectOption waits for the real select to
  // replace the pending spinner.
  await page.getByLabel("Category").selectOption({ label: "Cheese" });

  if (browserName === "firefox") {
    // Firefox hides the custom trigger by design (the native date input's
    // own picker wins there) — type the ISO date instead.
    await expect(page.getByTitle("Open calendar")).toBeHidden();
    await page.getByLabel("Restocked").fill(iso);
  } else {
    await page.getByTitle("Open calendar").click();
    await page.locator(`button[data-iso="${iso}"]`).click();
  }
  await expect(page.getByLabel("Restocked")).toHaveValue(iso);

  await editor.getByRole("button", { name: "Add" }).click();

  const row = productRow(page, name);
  await expect(row).toBeVisible();
  const cells = row.getByRole("cell");
  await expect(cells.nth(CELL.name)).toHaveText(name);
  await expect(cells.nth(CELL.category)).toHaveText("Cheese");
  await expect(cells.nth(CELL.price)).toHaveText("63");
  await expect(cells.nth(CELL.stock)).toHaveText("8");
  await expect(cells.nth(CELL.restocked)).toHaveText(iso);
});

test("clearing the category saves 'No category' and renders —", async ({
  page,
}) => {
  await openInventory(page);

  const name = `E2E Nocat ${Date.now()}`;
  const row = await createProduct(page, name, { category: "Cheese" });
  await expect(row.getByRole("cell").nth(CELL.category)).toHaveText("Cheese");

  await row.getByRole("button", { name: "Edit" }).click();
  const category = page.getByLabel("Category");
  await expect(category).toHaveValue("cat-cheese");
  // "No category" is a real, selectable choice on this optional select.
  await category.selectOption({ label: "No category" });
  await page.getByRole("button", { name: "Save" }).click();

  await expect(row.getByRole("cell").nth(CELL.category)).toHaveText("—");
});

test("cancel discards an edit; save applies it", async ({ page }) => {
  await openInventory(page);

  const name = `E2E Editable ${Date.now()}`;
  const row = await createProduct(page, name, { price: "40" });

  // Cancel: the draft drops, the display row keeps its values.
  await row.getByRole("button", { name: "Edit" }).click();
  const price = page.getByLabel("Price");
  await expect(price).toHaveValue("40");
  await price.fill("999");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByLabel("Price")).toHaveCount(0);
  await expect(row.getByRole("cell").nth(CELL.price)).toHaveText("40");

  // Save: reopening reseeds from the row (not the dropped draft), and the
  // change lands after submit.
  await row.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByLabel("Price")).toHaveValue("40");
  await page.getByLabel("Price").fill("77");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(row.getByRole("cell").nth(CELL.price)).toHaveText("77");
  await expect(page.getByLabel("Price")).toHaveCount(0);
});

test("opening a second editor closes the first — one editor per table", async ({
  page,
}) => {
  await openInventory(page);

  const comte = productRow(page, "Comté 18mo");
  const rioja = productRow(page, "Rioja Reserva");

  await comte.getByRole("button", { name: "Edit" }).click();
  const nameBox = page.getByRole("textbox", { name: "Name" });
  await expect(nameBox).toHaveValue("Comté 18mo");
  // While its editor is open the display row is replaced by the editor.
  await expect(comte).toHaveCount(0);

  // Dirty the draft so the switch below has something to drop.
  await nameBox.fill("E2E dropped draft");

  // Switching within the SAME table is silent: the first editor closes,
  // its draft drops, and exactly one editor row remains.
  await rioja.getByRole("button", { name: "Edit" }).click();
  await expect(nameBox).toHaveValue("Rioja Reserva");
  await expect(nameBox).toHaveCount(1);
  await expect(comte).toBeVisible();

  // The dropped draft must NOT resurrect: remote form instances are
  // cached per row, so reopening Comté proves the editor reseeds from
  // the row — not from the abandoned edit.
  await comte.getByRole("button", { name: "Edit" }).click();
  await expect(nameBox).toHaveValue("Comté 18mo");

  // Leave the seed rows untouched for the other tests.
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(comte).toBeVisible();
  await expect(rioja).toBeVisible();
});

test("deletes the row it created", async ({ page }) => {
  await openInventory(page);

  const name = `E2E Doomed ${Date.now()}`;
  const row = await createProduct(page, name);

  await row.getByRole("button", { name: "Delete" }).click();
  await expect(row).toHaveCount(0);
  // Only the spec's own row went away.
  await expect(productRow(page, "Comté 18mo")).toBeVisible();
});
