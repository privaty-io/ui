import type { Locator, Page } from "@playwright/test";
import { settle } from "./support/helpers";
import { expect, test } from "./support/test";

// The suppliers onboarding form: premature submits, touch-gated errors,
// the full picker-driven happy path, the clearable region, and Reset.
//
// All date-ish values derive from "today" so the pickers' default views
// (which center on today) always contain the cells the tests click.
const pad = (n: number) => String(n).padStart(2, "0");
const now = new Date();
const dateIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const monthIso = dateIso.slice(0, 7);

/** ISO-8601 week id ("YYYY-Www") — same Thursday-anchored algorithm the
 * library's calendar engine uses, so the picked cell and the asserted
 * value agree. */
function isoWeekOf(date: Date): string {
  const thursday = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const weekday = thursday.getUTCDay() || 7; // Mon=1 … Sun=7
  thursday.setUTCDate(thursday.getUTCDate() + 4 - weekday);
  const weekYear = thursday.getUTCFullYear();
  const days = (thursday.getTime() - Date.UTC(weekYear, 0, 1)) / 86_400_000;
  return `${weekYear}-W${pad(Math.ceil((days + 1) / 7))}`;
}
const weekIso = isoWeekOf(now);

/** The field wrapper (label + control + error list) for a given label.
 * Every input renders as a direct child <div> of the form. */
function field(page: Page, label: string): Locator {
  return page
    .locator("form > div")
    .filter({ has: page.locator("label", { hasText: label }) });
}

/** A field's currently displayed validation messages. */
function errorsOf(page: Page, label: string): Locator {
  return field(page, label).locator("ul > li");
}

/** Every "This field is required" message currently displayed. */
function requiredMessages(page: Page): Locator {
  return page.locator("form li", { hasText: "This field is required" });
}

/**
 * Loads /app/suppliers and waits until the page is genuinely interactive.
 * The "(optional)" markers only render after the Form's onMount settles
 * every field registration — client-only, so their presence proves
 * hydration finished and all form listeners are attached. Events fired
 * earlier would fall on deaf ears (lost touches, or worst case a native
 * full-page POST on a submit).
 */
async function openSuppliers(page: Page): Promise<void> {
  await page.goto("/app/suppliers");
  await expect(
    page.getByRole("heading", { level: 1, name: "Suppliers" }),
  ).toBeVisible();
  await expect(page.locator("label", { hasText: "Region" })).toContainText(
    "(optional)",
  );
  await settle(page);
}

/** Attempts a submit the way Enter in a field would. The Onboard button is
 * disabled until the form is dirty AND valid (its default gate), so a
 * premature attempt can never arrive through the button — requestSubmit
 * fires the same form-level submit event the implicit submission path
 * uses, which is what opens the error gates. */
async function attemptSubmit(page: Page): Promise<void> {
  await page
    .locator("form")
    .evaluate((form: HTMLFormElement) => form.requestSubmit());
}

test("premature submit reveals the resolved validation messages", async ({
  page,
}) => {
  await openSuppliers(page);

  // Pristine form: the submit gate is closed and no field complains yet.
  const onboard = page.getByRole("button", { name: "Onboard" });
  await expect(onboard).toBeDisabled();
  await expect(requiredMessages(page)).toHaveCount(0);

  await attemptSubmit(page);

  // Every empty required field now shows the RESOLVED message (the
  // schema's own code is "required") — name, email, and the three dates.
  await expect(requiredMessages(page)).toHaveCount(5);
  await expect(errorsOf(page, "Name")).toHaveText(["This field is required"]);
  // OBSERVED (suspected app-schema bug): the empty email carries BOTH
  // messages — the valibot pipe runs every action even after nonEmpty
  // fails, so email("") fails too. The intended UX (format message only
  // once non-empty-but-invalid) would need abortPipeEarly or a check
  // guard in the schema.
  await expect(errorsOf(page, "Email")).toHaveText([
    "This field is required",
    "That is not an email address",
  ]);
  // The three date-ish fields show the same double pattern (nonEmpty and
  // the format regex both fail on ""). Pinned per field so the resolver's
  // invalid-date/month/week codes are actually exercised — a resolver
  // regression leaking raw codes would slip past a bare count.
  await expect(errorsOf(page, "Contract start")).toHaveText([
    "This field is required",
    "Use the date picker or YYYY-MM-DD",
  ]);
  await expect(errorsOf(page, "First billing month")).toHaveText([
    "This field is required",
    "Use the month picker or YYYY-MM",
  ]);
  await expect(errorsOf(page, "Delivery week")).toHaveText([
    "This field is required",
    "Use the week picker or YYYY-Www",
  ]);
  // The optional fields stay quiet.
  await expect(errorsOf(page, "Region")).toHaveCount(0);
  await expect(errorsOf(page, "Notes")).toHaveCount(0);

  // Once the value is non-empty-but-invalid, only the format message
  // remains.
  await page.getByLabel("Email", { exact: true }).fill("not-an-email");
  await expect(errorsOf(page, "Email")).toHaveText([
    "That is not an email address",
  ]);
  await expect(requiredMessages(page)).toHaveCount(4);

  // Still nothing submittable.
  await expect(onboard).toBeDisabled();
});

test("errors are touch-gated until a submit attempt", async ({ page }) => {
  await openSuppliers(page);

  // Touch the name field: type, then clear. Its own error surfaces…
  const name = page.getByLabel("Name", { exact: true });
  await name.fill("Temporary");
  await name.fill("");
  await expect(errorsOf(page, "Name")).toHaveText(["This field is required"]);

  // …while every untouched field stays quiet, invalid as it may be.
  await expect(requiredMessages(page)).toHaveCount(1);
  await expect(errorsOf(page, "Email")).toHaveCount(0);
  await expect(errorsOf(page, "Contract start")).toHaveCount(0);

  // A submit attempt opens the gates for everyone.
  await attemptSubmit(page);
  await expect(requiredMessages(page)).toHaveCount(5);
});

test("the full onboarding journey", async ({ page }) => {
  const supplierName = `E2E Supplier ${Date.now()}`;
  const supplierEmail = `e2e.supplier.${Date.now()}@example.com`;
  await openSuppliers(page);

  await page.getByLabel("Name", { exact: true }).fill(supplierName);
  await page.getByLabel("Email", { exact: true }).fill(supplierEmail);
  await page.getByLabel("Region").selectOption({ label: "Spain" });

  // Contract start. Chromium: through the calendar popover. Firefox hides
  // the trigger on DATE pickers by design (the native input's own icon
  // wins there) — type the ISO value instead.
  const contractStart = page.getByLabel("Contract start", { exact: true });
  const contractTrigger = field(page, "Contract start").getByRole("button", {
    name: "Open calendar",
  });
  if (test.info().project.name === "firefox") {
    await expect(contractTrigger).toBeHidden();
    await contractStart.fill(dateIso);
  } else {
    await contractTrigger.click();
    await field(page, "Contract start")
      .locator(`button[data-iso="${dateIso}"]`)
      .click();
  }
  await expect(contractStart).toHaveValue(dateIso);

  // First billing month — the month picker popover exists everywhere.
  await field(page, "First billing month")
    .getByRole("button", { name: "Open calendar" })
    .click();
  await field(page, "First billing month")
    .locator(`button[data-iso="${monthIso}"]`)
    .click();
  await expect(
    page.getByLabel("First billing month", { exact: true }),
  ).toHaveValue(monthIso);

  // Delivery week — the week picker popover exists everywhere.
  await field(page, "Delivery week")
    .getByRole("button", { name: "Open calendar" })
    .click();
  await field(page, "Delivery week")
    .locator(`button[data-iso="${weekIso}"]`)
    .click();
  await expect(page.getByLabel("Delivery week", { exact: true })).toHaveValue(
    weekIso,
  );

  await page.getByLabel("Notes").fill("Delivers every Tuesday.");
  await page.getByLabel("Certified organic").check();

  // Dirty and valid — the gate opens.
  const onboard = page.getByRole("button", { name: "Onboard" });
  await expect(onboard).toBeEnabled();
  await onboard.click();

  // The new supplier appears in the live list with everything we entered.
  const item = page
    .getByTestId("supplier-list")
    .getByRole("listitem")
    .filter({ hasText: supplierName });
  await expect(item).toBeVisible();
  await expect(item).toContainText(supplierEmail);
  await expect(item).toContainText("organic");
  await expect(item).toContainText("spain");
  await expect(item).toContainText(`starts ${dateIso}`);
  await expect(item).toContainText(`bills from ${monthIso}`);
  await expect(item).toContainText(`delivers ${weekIso}`);
  await expect(item).toContainText("Delivers every Tuesday.");

  // Success resets the form back to pristine.
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Region")).toHaveValue("");
  await expect(contractStart).toHaveValue("");
  await expect(
    page.getByLabel("First billing month", { exact: true }),
  ).toHaveValue("");
  await expect(page.getByLabel("Delivery week", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByLabel("Notes")).toHaveValue("");
  await expect(page.getByLabel("Certified organic")).not.toBeChecked();
  await expect(onboard).toBeDisabled();
});

test("a supplier onboarded with the region cleared shows 'no region'", async ({
  page,
}) => {
  const supplierName = `E2E NoRegion ${Date.now()}`;
  await openSuppliers(page);

  await page.getByLabel("Name", { exact: true }).fill(supplierName);
  await page
    .getByLabel("Email", { exact: true })
    .fill(`e2e.noregion.${Date.now()}@example.com`);

  // Pick a region, then explicitly clear it back to "No region" — the
  // clearable placeholder is a real selectable option.
  const region = page.getByLabel("Region");
  await region.selectOption({ label: "Portugal" });
  await expect(region).toHaveValue("portugal");
  await region.selectOption({ label: "No region" });
  await expect(region).toHaveValue("");

  // Typed ISO date works in every browser; pickers for the other two.
  await page.getByLabel("Contract start", { exact: true }).fill(dateIso);
  await field(page, "First billing month")
    .getByRole("button", { name: "Open calendar" })
    .click();
  await field(page, "First billing month")
    .locator(`button[data-iso="${monthIso}"]`)
    .click();
  await field(page, "Delivery week")
    .getByRole("button", { name: "Open calendar" })
    .click();
  await field(page, "Delivery week")
    .locator(`button[data-iso="${weekIso}"]`)
    .click();

  await page.getByRole("button", { name: "Onboard" }).click();

  const item = page
    .getByTestId("supplier-list")
    .getByRole("listitem")
    .filter({ hasText: supplierName });
  await expect(item).toBeVisible();
  await expect(item).toContainText("no region");
  // Unchecked organic never made it into the marker.
  await expect(item).not.toContainText("organic");
});

test("Reset restores initial values and clears errors", async ({ page }) => {
  await openSuppliers(page);

  // Nothing to reset while pristine.
  const reset = page.getByRole("button", { name: "Reset" });
  await expect(reset).toBeDisabled();

  // Dirty the form, including a visible validation error.
  await page.getByLabel("Name", { exact: true }).fill("E2E Reset Scratch");
  await page.getByLabel("Email", { exact: true }).fill("not-an-email");
  await expect(errorsOf(page, "Email")).toHaveText([
    "That is not an email address",
  ]);
  await page.getByLabel("Region").selectOption({ label: "Germany" });
  await page.getByLabel("Contract start", { exact: true }).fill(dateIso);
  await page.getByLabel("Notes").fill("scratch");
  await page.getByLabel("Certified organic").check();

  await expect(reset).toBeEnabled();
  await reset.click();

  // Everything back to initial, errors gone, both buttons gated again.
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Region")).toHaveValue("");
  await expect(page.getByLabel("Contract start", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByLabel("Notes")).toHaveValue("");
  await expect(page.getByLabel("Certified organic")).not.toBeChecked();
  await expect(page.locator("form li")).toHaveCount(0);
  await expect(reset).toBeDisabled();
  await expect(page.getByRole("button", { name: "Onboard" })).toBeDisabled();
});
