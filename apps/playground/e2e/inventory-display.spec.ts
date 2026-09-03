import type { Page } from "@playwright/test";
import { settle } from "./support/helpers";
import { expect, test } from "./support/test";

// The inventory table's READ side: the rows-source loading veil on fresh
// load and refresh, resolved category labels, tri-state sorting, and the
// reload/client-nav parity of the rendered result. Everything asserted
// here comes from the seed data; other specs may add their own rows, so
// order assertions always FILTER down to the seed products instead of
// assuming they are alone in the table.

const SEED_NAMES = [
  "Comté 18mo",
  "Rioja Reserva",
  "Sourdough",
  "Gift basket",
  "Époisses",
];

/** The display row whose Name cell is exactly `name` — exact cell match so
 * a prefixed product from another spec never collides. */
const rowFor = (page: Page, name: string) =>
  page
    .locator("tbody tr")
    .filter({ has: page.getByRole("cell", { name, exact: true }) });

/** The rendered order of the SEED products' Name cells — rows other specs
 * created are ignored, keeping the relative-order assertions self-contained. */
async function seedOrder(page: Page): Promise<string[]> {
  const texts = await page
    .locator("tbody tr > td:nth-child(2)")
    .allTextContents();
  return texts.map((text) => text.trim()).filter((t) => SEED_NAMES.includes(t));
}

/** Holds every remote-function response for `ms` so a loading window is
 * deterministic instead of a race against the seed's ~150ms delay. */
async function holdRemoteCalls(page: Page, ms: number): Promise<void> {
  await page.route("**/_app/remote/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.continue();
  });
}

test("fresh load veils first, then fills rows without a 'No rows' flash", async ({
  page,
}) => {
  // Record from document creation on whether the empty state's text ever
  // enters the DOM — a flash between "veiled" and "rows landed" would be
  // invisible to after-the-fact assertions.
  await page.addInitScript(() => {
    const w = window as unknown as { __noRowsFlashed: boolean };
    w.__noRowsFlashed = false;
    const hit = (text: string | null | undefined) =>
      text?.includes("No rows") ?? false;
    const check = (records: MutationRecord[] = []) => {
      if (hit(document.documentElement?.textContent)) w.__noRowsFlashed = true;
      // The records catch a same-task add+remove the current-state check
      // above would miss: a node detached before the callback runs still
      // carries its text.
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (hit(node.textContent)) w.__noRowsFlashed = true;
        }
        if (record.type === "characterData" && hit(record.target.textContent)) {
          w.__noRowsFlashed = true;
        }
      }
    };
    new MutationObserver(check).observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    check();
  });
  await holdRemoteCalls(page, 800);

  // "commit" on purpose: the veil is in the SSR payload, and waiting for
  // "load" could let the rows land before the first look.
  await page.goto("/app/inventory", { waitUntil: "commit" });

  // SSR ships the loading state: the live region announces it, the veil
  // covers the table, and the (still row-less) table is inert. The VISIBLE
  // veil has two phases — before the client's scrollport measurement it is
  // the aria-hidden absolute cover OUTSIDE the status region, after it the
  // px-sized div inside — so the assert accepts either (asserting only the
  // status-region div races the measurement on fast machines: CI chromium
  // failed exactly there). Both branches are scoped to the veiled table's
  // own wrapper — a page-global [aria-hidden].absolute match could be
  // satisfied by any decorative div and prove nothing.
  const veil = page.getByRole("status");
  await expect(veil).toContainText("Loading");
  await expect(
    page
      .locator(
        'div:has(> table[inert]) [role="status"] > div, div:has(> table[inert]) > div[aria-hidden="true"].absolute',
      )
      .first(),
  ).toBeVisible();
  await expect(page.locator("table[inert]")).toHaveCount(1);
  // BEFORE the held query resolves there are no rows — and no "No rows"
  // either (asserted at the end via the flash flag).
  await expect(page.locator("tbody tr")).toHaveCount(0);

  // The query lands: rows appear, the veil empties, inert lifts.
  await expect(rowFor(page, "Comté 18mo")).toBeVisible();
  await expect(veil).not.toContainText("Loading");
  await expect(page.locator("table[inert]")).toHaveCount(0);

  await settle(page);
  expect(
    await page.evaluate(
      () => (window as unknown as { __noRowsFlashed: boolean }).__noRowsFlashed,
    ),
  ).toBe(false);
});

test("the seed products render with resolved category labels", async ({
  page,
}) => {
  await page.goto("/app/inventory");

  // Categories land ~50ms after the rows; the retrying assertions ride
  // out the brief "—" placeholder every category cell shows until then.
  const expected: [string, string][] = [
    ["Comté 18mo", "Cheese"],
    ["Rioja Reserva", "Wine"],
    ["Sourdough", "Bread"],
    ["Gift basket", "—"], // no category — the label must stay the dash
    ["Époisses", "Cheese"],
  ];
  for (const [name, category] of expected) {
    const row = rowFor(page, name);
    await expect(row).toBeVisible();
    await expect(row.locator("td").nth(2)).toHaveText(category);
  }
  await settle(page);
});

test("the Name header cycles ascending, descending, off", async ({ page }) => {
  await page.goto("/app/inventory");
  await expect(rowFor(page, "Époisses")).toBeVisible();

  const nameHeader = page.locator("th[data-column='name']");
  const nameButton = nameHeader.getByRole("button", { name: "Name" });
  const ascending = [
    "Comté 18mo",
    "Époisses",
    "Gift basket",
    "Rioja Reserva",
    "Sourdough",
  ];

  // aria-sort flips in the same flush as the row order, so once it shows
  // the rows are safe to read without retries.
  await nameButton.click();
  await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
  expect(await seedOrder(page)).toEqual(ascending);

  await nameButton.click();
  await expect(nameHeader).toHaveAttribute("aria-sort", "descending");
  expect(await seedOrder(page)).toEqual([...ascending].reverse());

  // Third click switches sorting OFF — back to insertion order, not a
  // third direction.
  await nameButton.click();
  await expect(nameHeader).not.toHaveAttribute("aria-sort");
  expect(await seedOrder(page)).toEqual(SEED_NAMES);
  await settle(page);
});

test("the Price sort orders numerically", async ({ page }) => {
  await page.goto("/app/inventory");
  await expect(rowFor(page, "Époisses")).toBeVisible();

  const priceHeader = page.locator("th[data-column='price']");
  const priceButton = priceHeader.getByRole("button", { name: "Price" });
  // 42, 74, 89, 129, 249 — a lexicographic sort would put Rioja (129)
  // first and Comté (89) last, so this order proves numeric comparison.
  const byPrice = [
    "Sourdough",
    "Époisses",
    "Comté 18mo",
    "Rioja Reserva",
    "Gift basket",
  ];

  await priceButton.click();
  await expect(priceHeader).toHaveAttribute("aria-sort", "ascending");
  expect(await seedOrder(page)).toEqual(byPrice);

  await priceButton.click();
  await expect(priceHeader).toHaveAttribute("aria-sort", "descending");
  expect(await seedOrder(page)).toEqual([...byPrice].reverse());
  await settle(page);
});

test("Refresh veils the table while in flight, then rows return", async ({
  page,
}) => {
  await page.goto("/app/inventory");
  await expect(rowFor(page, "Comté 18mo")).toBeVisible();
  await settle(page);

  // Hold the refetch so the refresh veil is observable, not theoretical.
  await holdRemoteCalls(page, 800);
  await page.getByRole("button", { name: "Refresh" }).click();

  const veil = page.getByRole("status");
  await expect(veil).toContainText("Loading");
  await expect(page.locator("table[inert]")).toHaveCount(1);
  // Unlike fresh load, refresh keeps the STALE rows in the DOM beneath
  // the veil — the veil + inert are what shield the user from them.
  expect(await seedOrder(page)).toEqual(SEED_NAMES);

  await expect(veil).not.toContainText("Loading");
  await expect(page.locator("table[inert]")).toHaveCount(0);
  // All five seed rows land from the refetch, still in insertion order —
  // a toBeVisible here would prove nothing: the stale rows were "visible"
  // (occlusion-blind) throughout the veiled window too.
  expect(await seedOrder(page)).toEqual(SEED_NAMES);
  await settle(page);
});

test("full reload and client-side navigation render the same table", async ({
  page,
}) => {
  // Waiting for Comté's category label guarantees the categories query
  // landed, so the snapshot never captures placeholder dashes.
  const settled = async () => {
    await expect(rowFor(page, "Comté 18mo").locator("td").nth(2)).toHaveText(
      "Cheese",
    );
    await expect(page.getByRole("status")).not.toContainText("Loading");
  };
  // Name..Restocked cells of the seed rows, in rendered order — the
  // chrome cells (expander, actions) carry no data and are sliced off.
  const snapshot = async () => {
    const rows = page.locator("tbody tr");
    const seedRows: string[][] = [];
    for (let index = 0; index < (await rows.count()); index++) {
      const cells = await rows.nth(index).locator("td").allTextContents();
      const trimmed = cells.map((text) => text.trim());
      if (SEED_NAMES.includes(trimmed[1] ?? "")) {
        seedRows.push(trimmed.slice(1, 6));
      }
    }
    return seedRows;
  };

  // Path 1: a direct load (SSR + hydration + client fill-in).
  await page.goto("/app/inventory");
  await expect(
    page.getByRole("heading", { level: 1, name: "Inventory" }),
  ).toBeVisible();
  await settled();
  const reloadRows = await snapshot();
  expect(reloadRows).toHaveLength(5);
  await settle(page);

  // Path 2: a client-side navigation from /app.
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { level: 1, name: "Back office" }),
  ).toBeVisible();
  await settle(page);
  // Plant a marker on the /app window: a full page load would wipe it
  // with the JS realm. Without this, a link that fell back to a hard
  // navigation (broken hydration, data-sveltekit-reload) would silently
  // turn this test into reload-vs-reload and it would still pass.
  await page.evaluate(() => {
    (window as unknown as { __sameRealm?: boolean }).__sameRealm = true;
  });
  await page.getByRole("link", { name: "Inventory" }).first().click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Inventory" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as unknown as { __sameRealm?: boolean }).__sameRealm,
    ),
  ).toBe(true);
  await settled();

  expect(await snapshot()).toEqual(reloadRows);
  await settle(page);
});
