import { createRawSnippet } from "svelte";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import CenteredPage from "./centered-page.svelte";
import Footer from "./footer.svelte";
import Header from "./header.svelte";
import ListDetail from "./list-detail.svelte";
import Page from "./page.svelte";
import { layoutsTheme } from "./theme";

const label = (text: string) =>
  createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe("header", () => {
  test("a labeled tile row: brand left, actions docked to the end", async () => {
    const screen = await render(Header, {
      title: "Cellar Ops",
      subtitle: "demo",
      actions: label("Sync"),
    });

    const root = screen.container.querySelector(
      'section[aria-label="Header"]',
    ) as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.textContent).toContain("Cellar Ops");
    expect(root.textContent).toContain("demo");
    const actions = root.lastElementChild as HTMLElement;
    expect(actions.textContent?.trim()).toBe("Sync");
    expect(actions.className).toContain("ml-auto");
  });

  test("themeToggle drops the core ThemeToggle into the end dock", async () => {
    const screen = await render(Header, {
      title: "Toggled",
      themeToggle: true,
    });

    await expect
      .element(screen.getByRole("button", { name: "Switch theme" }))
      .toBeInTheDocument();
  });

  test("a brand snippet replaces the title block", async () => {
    const screen = await render(Header, {
      brand: label("The Logo"),
      label: "Branded header",
    });

    const root = screen.container.querySelector(
      'section[aria-label="Branded header"]',
    ) as HTMLElement;
    expect(root.textContent).toContain("The Logo");
    expect(root.querySelector(".tracking-wide")).toBeNull();
  });
});

describe("footer", () => {
  test("a tile of quiet fine print with an end dock, cues included", async () => {
    const screen = await render(Footer, {
      children: label("nav 230px"),
      end: label("hints"),
    });

    const root = screen.container.querySelector(
      'section[aria-label="Footer"]',
    ) as HTMLElement;
    for (const cls of layoutsTheme.footer.root.split(" ")) {
      expect(root.className).toContain(cls);
    }
    // An interactive tile like every pane — it warms under the pointer.
    expect(root.className).toContain("hover:");
    expect(root.textContent).toContain("nav 230px");
    expect((root.lastElementChild as HTMLElement).textContent).toBe("hints");
  });
});

describe("page", () => {
  test("wraps children in a scrolling main tile that fills the column", async () => {
    const screen = await render(Page, { children: label("the page") });

    const main = screen.container.querySelector(
      'section[aria-label="Content"]',
    ) as HTMLElement;
    expect(main.textContent).toBe("the page");
    for (const cls of layoutsTheme.pageRoot.split(" ")) {
      expect(main.className, cls).toContain(cls);
    }
    expect(main.className).toContain("overflow-y-auto");
  });

  test("flow is the document stance: grows with content, no internal scroll", async () => {
    const screen = await render(Page, {
      flow: true,
      children: label("a long document"),
    });

    const main = screen.container.querySelector(
      'section[aria-label="Content"]',
    ) as HTMLElement;
    for (const cls of layoutsTheme.pageFlow.split(" ")) {
      expect(main.className, cls).toContain(cls);
    }
    // The page scrolls, not the tile — and no basis-0 pinning.
    expect(main.className).not.toContain("overflow-y-auto");
    expect(main.className).not.toContain("flex-1");
  });

  test("bare hands the space over raw — same sizing, no tile", async () => {
    const screen = await render(Page, {
      bare: true,
      children: label("raw content"),
    });

    expect(screen.container.querySelector("section")).toBeNull();
    const root = screen.container.firstElementChild as HTMLElement;
    expect(root.textContent).toBe("raw content");
    for (const cls of layoutsTheme.pageRoot.split(" ")) {
      expect(root.className, cls).toContain(cls);
    }
  });
});

describe("list detail", () => {
  test("two labeled scrolling panes around a resizable gutter", async () => {
    const screen = await render(ListDetail, {
      list: label("the rows"),
      detail: label("the picked row"),
      listLabel: "Orders",
      detailLabel: "Order detail",
      resizeLabel: "Resize orders",
      initial: 300,
    });

    const list = screen.container.querySelector('section[aria-label="Orders"]');
    const detail = screen.container.querySelector(
      'section[aria-label="Order detail"]',
    );
    expect(list?.textContent).toBe("the rows");
    expect(detail?.textContent).toBe("the picked row");
    for (const cls of layoutsTheme.listDetail.pane.split(" ")) {
      expect(list?.className, cls).toContain(cls);
    }

    const gutter = screen.container.querySelector('[role="separator"]');
    expect(gutter?.getAttribute("aria-label")).toBe("Resize orders");
    expect(gutter?.getAttribute("aria-valuenow")).toBe("300");
  });

  test("default labels name the panes List and Detail", async () => {
    const screen = await render(ListDetail, {
      list: label("a"),
      detail: label("b"),
    });

    expect(
      screen.container.querySelector('section[aria-label="List"]'),
    ).not.toBeNull();
    expect(
      screen.container.querySelector('section[aria-label="Detail"]'),
    ).not.toBeNull();
  });
});

describe("centered page", () => {
  test("one titled card centered in the space, footer below — no canvas of its own", async () => {
    const screen = await render(CenteredPage, {
      title: "Sign in",
      children: label("form goes here"),
      footer: label("No account?"),
    });

    // The landmark name defaults to the title.
    const card = screen.container.querySelector(
      'section[aria-label="Sign in"]',
    );
    expect(card).not.toBeNull();
    expect(card?.querySelector("h2")?.textContent).toBe("Sign in");

    const frame = card?.parentElement as HTMLElement;
    expect(frame.className).toContain("max-w-sm"); // the default width
    expect(frame.lastElementChild?.textContent).toBe("No account?");

    // Canvas-transparent: the scaffold root only centers (the Frame
    // behind provides the ground).
    const root = frame.parentElement as HTMLElement;
    for (const cls of layoutsTheme.centered.root.split(" ")) {
      expect(root.className, cls).toContain(cls);
    }
    expect(root.className).not.toContain("bg-");
  });

  test("width picks the card's cap", async () => {
    const screen = await render(CenteredPage, {
      width: "lg",
      children: label("wide content"),
    });

    const frame = screen.container.querySelector("section")
      ?.parentElement as HTMLElement;
    expect(frame.className).toContain("max-w-lg");
  });
});
