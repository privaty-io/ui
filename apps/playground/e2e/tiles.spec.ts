import type { Locator, Page } from "@playwright/test";
import { settle } from "./support/helpers";
import { expect, test } from "./support/test";

// The tiling showcase: pane cues, the resizable split tree (driven with
// a REAL mouse — the gesture the gutters exist for; synthetic pointer
// events don't reach the handlers in the unit harness), and the theme
// toggle flipping the whole page under the console guard.

const mainTile = (page: Page) =>
  page.locator('section[aria-label="Supplier onboarding"]');
const navTile = (page: Page) =>
  page.locator('section[aria-label="Navigation"]');
const navGutter = (page: Page) =>
  page.getByRole("separator", { name: "Resize navigation" });

async function openTiles(page: Page) {
  await page.goto("/sandbox/tiles");
  await expect(
    page.getByRole("heading", { name: "Onboard a supplier" }),
  ).toBeVisible();
  // The gutter/toggle interactions need HYDRATED handlers — the heading
  // renders long before that (SSR), and un-settled clicks land on dead
  // elements.
  await settle(page);
}

const borderColor = (tile: Locator) =>
  tile.evaluate((el) => getComputedStyle(el).borderTopColor);

/** The border animates over 200ms — sampling mid-transition reads an
 * interpolated color that matches nothing. Wait for two consecutive
 * equal samples before trusting one. */
async function settledBorderColor(tile: Locator): Promise<string> {
  let previous = "";
  await expect
    .poll(
      async () => {
        const current = await borderColor(tile);
        const stable = current === previous;
        previous = current;
        return stable;
      },
      { intervals: [120], timeout: 5000 },
    )
    .toBe(true);
  return previous;
}

test("focus-within marks exactly the pane the keyboard is in", async ({
  page,
}) => {
  await openTiles(page);

  const resting = await settledBorderColor(mainTile(page));
  await page.getByLabel("Name").click();

  // The focused pane's border strengthens…
  const focused = await settledBorderColor(mainTile(page));
  expect(focused).not.toBe(resting);

  // Focus moving to another pane moves the cue with it. (The nav tile
  // is then hovered AND focused — the focus step must win; keyboard
  // moves focus away from the pointer to keep the comparison pure.)
  await page.getByRole("button", { name: "Dashboard" }).click();
  await page.mouse.move(640, 60);
  expect(await settledBorderColor(navTile(page))).toBe(focused);
  expect(await settledBorderColor(mainTile(page))).toBe(resting);
});

test("a real-mouse drag resizes the nav pane and binds the size out", async ({
  page,
}) => {
  await openTiles(page);

  const gutter = navGutter(page);
  const box = (await gutter.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 300);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + 300, { steps: 6 });
  await page.mouse.up();

  await expect
    .poll(async () => (await navTile(page).boundingBox())!.width)
    .toBeGreaterThan(280);
  // The page's bind:size readout follows.
  await expect(page.locator("section[aria-label=Status]")).toContainText(
    "nav 290px",
  );
});

test("keyboard: Home collapses, the edge stays single-inset, arrows reopen", async ({
  page,
}) => {
  await openTiles(page);

  await navGutter(page).focus();
  await page.keyboard.press("Home");
  await expect(page.locator("section[aria-label=Status]")).toContainText(
    "nav 0px",
  );

  // The collapse fix: the main tile's left edge sits at the canvas
  // padding (6px), not padding + gutter stacked.
  await expect
    .poll(async () => (await mainTile(page).boundingBox())!.x)
    .toBeLessThan(8);

  await page.keyboard.press("ArrowRight");
  await expect(page.locator("section[aria-label=Status]")).toContainText(
    "nav 170px",
  );
});

test("double-click resets a dragged gutter to its initial size", async ({
  page,
}) => {
  await openTiles(page);

  await navGutter(page).focus();
  await page.keyboard.press("End");
  await expect(page.locator("section[aria-label=Status]")).toContainText(
    "nav 360px",
  );

  await navGutter(page).dblclick();
  await expect(page.locator("section[aria-label=Status]")).toContainText(
    "nav 230px",
  );
});

test("the theme toggle flips the tiled page cleanly", async ({ page }) => {
  await openTiles(page);

  const scheme = () =>
    page.evaluate(() => document.documentElement.dataset.theme);
  const before = await scheme();

  // system -> light -> dark: two clicks always land on a REAL flip.
  const toggle = page.getByRole("button", { name: "Switch theme" });
  await toggle.click();
  await toggle.click();

  await expect.poll(scheme).toBe("dark");
  expect(before === "dark").toBe(false);
  // The console guard fails this test if the flip errors or warns.
});
