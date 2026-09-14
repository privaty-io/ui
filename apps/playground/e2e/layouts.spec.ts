import type { Page } from "@playwright/test";
import { settle } from "./support/helpers";
import { expect, test } from "./support/test";

// The layouts showcase: /sandbox/layouts is a real mini-app whose route
// layout composes the frame furniture (Header, status Footer) around a
// SidebarPage — compact-collapse from the panel button, NavItem
// navigation with the shell (and its tuned size) persisting, a
// ListDetail page, and a CenteredPage that leaves the shell via a
// layout reset. The console guard watches every step.

const status = (page: Page) =>
  page.locator('section[aria-label="Cellar status"]');

async function openLayouts(page: Page) {
  await page.goto("/sandbox/layouts");
  await expect(
    page.getByRole("heading", { name: "Cellar dashboard" }),
  ).toBeVisible();
  // The toggle/nav interactions need HYDRATED handlers — the heading
  // renders long before that (SSR).
  await settle(page);
}

test("the panel button compacts the nav to a usable icon rail and restores it", async ({
  page,
}) => {
  await openLayouts(page);

  const toggle = page.getByRole("button", { name: "Toggle navigation" });
  await toggle.click();
  await expect(status(page)).toContainText("nav 48px");
  // Compact, not gone: the pane narrows to the rail…
  await expect
    .poll(
      async () =>
        (await page.locator('section[aria-label="Navigation"]').boundingBox())!
          .width,
    )
    .toBeLessThan(60);

  // …and stays USABLE: labels turn sr-only, so the icon items keep
  // their accessible names and still navigate.
  await page.getByRole("link", { name: "Orders" }).click();
  await expect(
    page.locator('section[aria-label="Order detail"]'),
  ).toContainText("Bar Centrale");
  await expect(status(page)).toContainText("nav 48px");

  await toggle.click();
  await expect(status(page)).toContainText("nav 230px");
});

test("NavItems navigate between pages while the shell persists", async ({
  page,
}) => {
  await openLayouts(page);

  // Tune the nav width first — the shell must carry it across pages.
  await page.getByRole("separator", { name: "Resize navigation" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(status(page)).toContainText("nav 246px");

  await page.getByRole("link", { name: "Orders" }).click();
  await expect(
    page.locator('section[aria-label="Order detail"]'),
  ).toContainText("Bar Centrale");
  // aria-current moved with the page…
  await expect(page.getByRole("link", { name: "Orders" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  // …and the route layout — nav width included — survived the nav.
  await expect(status(page)).toContainText("nav 246px");
});

test("the orders page: picking a row fills the detail pane", async ({
  page,
}) => {
  await openLayouts(page);
  await page.getByRole("link", { name: "Orders" }).click();

  await page.getByRole("button", { name: "ORD-2110 · Café Aurelie" }).click();
  const detail = page.locator('section[aria-label="Order detail"]');
  await expect(detail).toContainText("Café Aurelie");
  await expect(detail).toContainText("tasting brochure");
});

test("the sign-in demo leaves the shell for a centered page", async ({
  page,
}) => {
  await openLayouts(page);

  await page.getByRole("link", { name: "Sign-in demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in to Cellar Ops" }),
  ).toBeVisible();
  // The shell is gone — a layout reset leaves no nav gutter behind.
  await expect(
    page.getByRole("separator", { name: "Resize navigation" }),
  ).toHaveCount(0);

  await page.getByLabel("Email").fill("lukas@cellar.test");

  // The footer link returns into the shell.
  await page.getByRole("link", { name: "back to the dashboard" }).click();
  await expect(
    page.getByRole("heading", { name: "Cellar dashboard" }),
  ).toBeVisible();
  await expect(
    page.getByRole("separator", { name: "Resize navigation" }),
  ).toBeVisible();
});
