import type { Locator, Page } from "@playwright/test";
import { settle } from "./support/helpers";
import { expect, test } from "./support/test";

// The deliveries schedule: quarter columns grouped under year headers, a
// pinned supplier column, an initial-column anchor on 2026-q1, controller
// jumps, and a density toggle.
//
// All of the scroll behavior needs a scrollport NARROWER than the table:
// at the default desktop viewport the whole schedule fits inside the
// max-w-5xl shell and nothing can scroll at all. This spec therefore runs
// at a phone-ish width where the schedule genuinely overflows. The page's
// heading/buttons row gives the layout a min-content width of ~390px, so
// the scrollport bottoms out there no matter how narrow the viewport goes
// — 410 is the narrowest width that avoids overflowing the page body too.
test.use({ viewport: { width: 410, height: 720 } });

/** The table's scroll wrapper — the direct parent of the schedule table. */
function scroller(page: Page): Locator {
  return page.locator("main table").locator("..");
}

function scrollLeftOf(wrapper: Locator): Promise<number> {
  return wrapper.evaluate((el) => Math.round(el.scrollLeft));
}

/**
 * Distance from a quarter column's left edge to the frozen edge (the
 * pinned supplier header's right edge) — 0 means "anchored". Both rects
 * are read in one evaluate so they come from the same frame even while a
 * smooth scroll is mid-flight.
 */
function anchorOffset(page: Page, key: string): Promise<number> {
  return page.evaluate((columnKey) => {
    const supplier = document.querySelector('th[data-column="supplier"]');
    const target = document.querySelector(`th[data-column="${columnKey}"]`);
    if (!supplier || !target) throw new Error("header cells missing");
    return Math.round(
      target.getBoundingClientRect().left -
        supplier.getBoundingClientRect().right,
    );
  }, key);
}

async function supplierHeaderX(page: Page): Promise<number> {
  const box = await page.locator('th[data-column="supplier"]').boundingBox();
  if (!box) throw new Error("supplier header not visible");
  return box.x;
}

/**
 * Waits until the rows have landed and the initial smooth anchor
 * animation has come to rest, returning the resting scrollLeft.
 */
async function waitForSettledSchedule(page: Page): Promise<number> {
  await expect(
    page.getByRole("cell", { name: "Fromagerie Petit" }),
  ).toBeVisible();
  const wrapper = scroller(page);
  let previous = -1;
  await expect
    .poll(
      async () => {
        const current = await scrollLeftOf(wrapper);
        const stable = current === previous;
        previous = current;
        return stable;
      },
      { intervals: [350], timeout: 15_000 },
    )
    .toBe(true);
  return previous;
}

/**
 * A user taking over the scroller: pointerdown releases the initial
 * anchor's ownership (the table listens for exactly that), then an
 * instant scroll to the requested position.
 */
async function userScroll(wrapper: Locator, left: number): Promise<void> {
  await wrapper.dispatchEvent("pointerdown");
  await wrapper.evaluate((el, target) => {
    el.scrollTo({ left: target });
  }, left);
}

test("year group headers are server-rendered and the schedule mounts scrolled toward 2026", async ({
  page,
}) => {
  // The grouped year headers and the column identities must come from
  // SSR — assert on the raw document of this very navigation, before
  // hydration can have contributed anything.
  const response = await page.goto("/app/deliveries");
  if (!response) throw new Error("no navigation response");
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).toContain('data-column="2026-q1"');
  expect(html).toContain('scope="colgroup"');
  // ">2026<" can only be the year group header: the page's own buttons
  // mention 2025 and 2027 but never 2026.
  expect(html).toContain(">2026<");
  for (const year of ["2025", "2026", "2027"]) {
    await expect(
      page.locator("thead").getByText(year, { exact: true }),
    ).toBeVisible();
  }

  const wrapper = scroller(page);
  const rest = await waitForSettledSchedule(page);

  // The schedule genuinely overflows its scrollport at this width…
  const overflow = await wrapper.evaluate(
    (el) => el.scrollWidth - el.clientWidth,
  );
  expect(overflow).toBeGreaterThan(300);

  // …and mounted scrolled to the 2026-q1 anchor. The table re-anchors
  // once the rows source lands (the header-only layout the mount-time
  // anchor measured is narrower), so the settled rest is flush at the
  // frozen edge.
  expect(rest).toBeGreaterThan(100);
  const offset = await anchorOffset(page, "2026-q1");
  expect(Math.abs(offset)).toBeLessThanOrEqual(3);
});

test("the 2025 and 2027 buttons jump the schedule across the years", async ({
  page,
}) => {
  await page.goto("/app/deliveries");
  await waitForSettledSchedule(page);
  const wrapper = scroller(page);

  // 2027-q1 starts far to the right of the frozen edge.
  expect(await anchorOffset(page, "2027-q1")).toBeGreaterThan(150);

  await page.getByRole("button", { name: "2027", exact: true }).click();
  // 2028's four quarters sit to the right of 2027-q1, so the anchor is
  // genuinely reachable — the jump lands flush at the frozen edge.
  await expect
    .poll(async () => Math.abs(await anchorOffset(page, "2027-q1")))
    .toBeLessThanOrEqual(2);

  await page.getByRole("button", { name: "2025", exact: true }).click();
  // 2024's quarters precede it, so this is a genuine mid-range anchor —
  // neither edge of the scroll range.
  await expect
    .poll(async () => Math.abs(await anchorOffset(page, "2025-q1")))
    .toBeLessThanOrEqual(2);
  expect(await scrollLeftOf(wrapper)).toBeGreaterThan(100);
});

test("horizontal scrolling keeps the supplier column pinned", async ({
  page,
}) => {
  await page.goto("/app/deliveries");
  const rest = await waitForSettledSchedule(page);
  const wrapper = scroller(page);

  const pinnedX = await supplierHeaderX(page);
  const before = await anchorOffset(page, "2026-q1");

  // Scroll 80px further right: the quarter columns shift left by exactly
  // that much while the supplier header does not move a pixel.
  await userScroll(wrapper, rest + 80);
  await expect
    .poll(async () =>
      Math.abs((await anchorOffset(page, "2026-q1")) - (before - 80)),
    )
    .toBeLessThanOrEqual(1);
  expect(Math.abs((await supplierHeaderX(page)) - pinnedX)).toBeLessThanOrEqual(
    1,
  );

  // All the way back to the left edge: still pinned, with 2024-q1 (the
  // first scrolling column) flush after it.
  await userScroll(wrapper, 0);
  await expect.poll(() => scrollLeftOf(wrapper)).toBe(0);
  await expect
    .poll(async () => Math.abs(await anchorOffset(page, "2024-q1")))
    .toBeLessThanOrEqual(1);
  expect(Math.abs((await supplierHeaderX(page)) - pinnedX)).toBeLessThanOrEqual(
    1,
  );
});

test("the density toggle shrinks and restores the row height", async ({
  page,
}) => {
  await page.goto("/app/deliveries");
  await expect(
    page.getByRole("cell", { name: "Fromagerie Petit" }),
  ).toBeVisible();

  const firstRow = page.locator("tbody tr").first();
  const comfortable = (await firstRow.boundingBox())?.height;
  if (comfortable === undefined) throw new Error("row not measurable");

  await page.getByRole("button", { name: "Density: comfortable" }).click();
  await expect(
    page.getByRole("button", { name: "Density: compact" }),
  ).toBeVisible();
  await expect
    .poll(async () => (await firstRow.boundingBox())?.height)
    .toBeLessThan(comfortable - 8);

  await page.getByRole("button", { name: "Density: compact" }).click();
  await expect(
    page.getByRole("button", { name: "Density: comfortable" }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const height = (await firstRow.boundingBox())?.height;
      return height === undefined ? Infinity : Math.abs(height - comfortable);
    })
    .toBeLessThanOrEqual(1);
});

test("supplier sorting works with pinned and grouped columns", async ({
  page,
}) => {
  await page.goto("/app/deliveries");
  await waitForSettledSchedule(page);

  const supplierTh = page.locator('th[data-column="supplier"]');
  const firstSupplier = page.locator("tbody tr").first().locator("td").first();
  const pinnedX = await supplierHeaderX(page);

  // Seed order first, then the full sort cycle: ascending → descending
  // → back off to seed order.
  await expect(firstSupplier).toHaveText("Fromagerie Petit");

  const sortButton = page.getByRole("button", { name: "Supplier" });
  await sortButton.click();
  await expect(supplierTh).toHaveAttribute("aria-sort", "ascending");
  await expect(firstSupplier).toHaveText("Bodega Ríos");

  await sortButton.click();
  await expect(supplierTh).toHaveAttribute("aria-sort", "descending");
  await expect(firstSupplier).toHaveText("Vinhos do Douro");

  await sortButton.click();
  await expect(supplierTh).not.toHaveAttribute("aria-sort");
  await expect(firstSupplier).toHaveText("Fromagerie Petit");

  // The pinned column and the year group headers survived the
  // re-renders.
  expect(Math.abs((await supplierHeaderX(page)) - pinnedX)).toBeLessThanOrEqual(
    1,
  );
  await expect(
    page.locator("thead").getByText("2026", { exact: true }),
  ).toBeVisible();
});

test("a user's scroll taken during load is not yanked when the rows land", async ({
  page,
}) => {
  // "Data refresh must not yank" only means something while data can
  // still arrive: hold the schedule rows at the network layer so the
  // user takes over the scroller while the rows are genuinely in
  // flight. (Unheld, the 120ms server delay makes that a race the test
  // would win only sometimes — and after the schedule settles, nothing
  // is pending that could move the scroller at all, so a park taken
  // then asserts stillness vacuously.)
  let releaseRows = () => {};
  const rowsHeld = new Promise<void>((resolve) => (releaseRows = resolve));
  await page.route("**/_app/remote/**", async (route) => {
    await rowsHeld;
    await route.continue();
  });

  await page.goto("/app/deliveries");
  const wrapper = scroller(page);

  // The initial anchor glide starts against the header-only layout —
  // once the scroller has moved, the table's mount attachment has run
  // and its user-ownership listeners are attached. Frame-granularity
  // polling so the takeover lands within a frame or two of the glide
  // starting, while the component's own re-anchor triggers (double-rAF,
  // fonts.ready) are still in flight.
  await expect
    .poll(() => scrollLeftOf(wrapper), {
      intervals: [16, 16, 16, 33, 66, 125, 250],
      timeout: 10_000,
    })
    .toBeGreaterThan(0);
  // The hold is genuinely holding: no data rows yet. If the remote
  // endpoint's URL shape ever stops matching the route, this fails
  // loudly instead of the test silently degrading into an
  // after-the-settle park.
  await expect(
    page.getByRole("cell", { name: "Fromagerie Petit" }),
  ).toHaveCount(0);

  // A user takes over mid-glide (pointerdown releases the initial
  // anchor's ownership) and parks somewhere deliberate — away from the
  // anchor, the left edge, and the maximum.
  await userScroll(wrapper, 60);
  await expect.poll(() => scrollLeftOf(wrapper)).toBe(60);
  const pinnedX = await supplierHeaderX(page);

  // NOW the rows land: the table widens, the scroll range grows, and
  // every measurement effect and late re-anchor trigger (double-rAF,
  // fonts.ready) that will ever run gets its chance. The position must
  // stay exactly where the user put it, with the supplier column still
  // pinned.
  releaseRows();
  await expect(
    page.getByRole("cell", { name: "Fromagerie Petit" }),
  ).toBeVisible();
  await settle(page, 1000);
  // A yank would move the scroller by tens or hundreds of px toward the
  // anchor; a couple px of drift from browser scroll anchoring while the
  // columns widen is acceptable.
  expect(Math.abs((await scrollLeftOf(wrapper)) - 60)).toBeLessThanOrEqual(3);
  expect(Math.abs((await supplierHeaderX(page)) - pinnedX)).toBeLessThanOrEqual(
    1,
  );
});
