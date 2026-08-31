import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import type { ComponentProps } from "svelte";
import { fakeTextField } from "@privaty/ui-forms/testing/fakes.svelte.js";
import Fixture from "./table.fixture.svelte";
import { TableController } from "./table-controller.svelte";
import {
  fakeEditableRemoteForm,
  fakeKeyedRemoteForm,
} from "./testing/fakes.svelte";
import "@privaty/ui/testing/tailwind.css";

describe("pinned geometry", () => {
  test("pinned columns stay contiguous with the expander under scroll", async () => {
    const screen = await render(Fixture, {
      rows: [
        { id: "r2", name: "Rioja", price: 129 },
        { id: "r1", name: "Comté", price: 89 },
      ],
      withExpanded: true,
      withPinnedPrice: true,
      // Narrow on purpose: forces horizontal overflow so sticky clamping
      // actually engages.
      containerClass: "w-64",
    });

    // The first div is the scroll wrapper (overflow-auto arrives on mount —
    // the container settles like the form markers do).
    const wrapper = screen.container.querySelector("div") as HTMLElement;
    wrapper.scrollLeft = 80;

    // Offsets are measured from rendered header widths, so the pinned price
    // column must sit flush against the expander — no hole, no overlap —
    // even while sticky clamping is active.
    await expect
      .poll(() => {
        const row = screen.container.querySelector("tbody tr");
        const cells = row ? [...row.querySelectorAll("td")] : [];
        const expander = cells[0]?.getBoundingClientRect();
        const pinned = cells[1]?.getBoundingClientRect();
        if (!expander || !pinned) return Number.NaN;
        return Math.abs(pinned.left - expander.right);
      })
      .toBeLessThan(1);

    // Sanity: Tailwind must actually be loaded, or the numbers above would
    // be measuring an unstyled table.
    const expanderCell = screen.container.querySelector("tbody td");
    expect(expanderCell?.getBoundingClientRect().width).toBeLessThan(60);
  });
});

describe("scroll preservation", () => {
  test("editor swaps keep the scroll position", async () => {
    const name = fakeTextField("name");
    const id = fakeTextField("id");
    const keyed = fakeKeyedRemoteForm(() =>
      fakeEditableRemoteForm({ id, name }),
    );
    const editForm = keyed.form as unknown as NonNullable<
      ComponentProps<typeof Fixture>["editForm"]
    >;
    const controller = new TableController();

    const screen = await render(Fixture, {
      rows: [
        { id: "r2", name: "Rioja", price: 129 },
        { id: "r1", name: "Comté", price: 89 },
      ],
      withExpanded: true,
      withPinnedPrice: true,
      editForm,
      controller,
      containerClass: "w-64",
    });

    const wrapper = () => screen.container.querySelector("div") as HTMLElement;
    wrapper().scrollLeft = 60;
    await expect.poll(() => wrapper().scrollLeft).toBe(60);

    // Opening an editor remounts the markup — the scroll must carry over.
    controller.startEdit("r2");
    await expect.element(screen.getByLabelText("Name")).toBeInTheDocument();
    await expect.poll(() => wrapper().scrollLeft).toBe(60);

    controller.close();
    await expect.element(screen.getByLabelText("Name")).not.toBeInTheDocument();
    await expect.poll(() => wrapper().scrollLeft).toBe(60);
  });
});

describe("vertical overflow", () => {
  test("a height-constrained table has no phantom vertical overflow", async () => {
    // Regression for the header-height phantom scroll: the fill mechanism
    // must not create scrollable height when the content fits.
    const empty = await render(Fixture, {
      rows: [],
      containerClass: "w-64 h-40",
    });
    const emptyWrapper = empty.container.querySelector("div") as HTMLElement;

    const filled = await render(Fixture, {
      rows: [
        { id: "r2", name: "Rioja", price: 129 },
        { id: "r1", name: "Comté", price: 89 },
      ],
      withPinnedPrice: true,
      containerClass: "w-40 h-40",
    });
    const filledWrapper = filled.container.querySelector("div") as HTMLElement;

    await expect
      .poll(() => emptyWrapper.scrollHeight - emptyWrapper.clientHeight)
      .toBe(0);
    await expect
      .poll(() => filledWrapper.scrollHeight - filledWrapper.clientHeight)
      .toBe(0);

    // The fill still paints: the filler region grows below sparse rows.
    const filler = filled.container.querySelector("div.grow") as HTMLElement;
    expect(filler.getBoundingClientRect().height).toBeGreaterThan(10);
  });
});

describe("empty state", () => {
  test("stays centered in the viewport under horizontal scroll", async () => {
    // Wide pinned column + narrow container: the header alone forces
    // horizontal overflow while the table has no rows.
    const screen = await render(Fixture, {
      rows: [],
      withPinnedPrice: true,
      containerClass: "w-40 h-40",
    });

    const wrapper = screen.container.querySelector("div") as HTMLElement;
    await expect
      .poll(() => wrapper.scrollWidth > wrapper.clientWidth)
      .toBe(true);

    const message = () =>
      screen.container.querySelector("div.grow > div") as HTMLElement;
    const before = message().getBoundingClientRect().left;

    wrapper.scrollLeft = 40;
    await expect
      .poll(() => Math.abs(message().getBoundingClientRect().left - before))
      .toBeLessThan(1);
  });
});

describe("loading veil", () => {
  test("covers the visible scrollport, header included, and pins under scroll", async () => {
    const screen = await render(Fixture, {
      rows: [
        { id: "r1", name: "Comté", price: 89 },
        { id: "r2", name: "Rioja", price: 129 },
      ],
      withPinnedPrice: true,
      loading: true,
      // Narrow + short: forces scrolling on both axes.
      containerClass: "w-64 h-40",
    });

    const wrapper = screen.container.querySelector("div") as HTMLElement;
    const veil = () =>
      screen.container.querySelector('[role="status"]') as HTMLElement;

    // Sized to the measured scrollport (clientWidth/Height exclude any
    // classic scrollbars) and aligned with the wrapper's padding box — the
    // header row sits underneath it.
    await expect
      .poll(() =>
        Math.abs(veil().getBoundingClientRect().width - wrapper.clientWidth),
      )
      .toBeLessThan(1.5);
    expect(
      Math.abs(veil().getBoundingClientRect().height - wrapper.clientHeight),
    ).toBeLessThan(1.5);

    const wrapperTop = wrapper.getBoundingClientRect().top + wrapper.clientTop;
    expect(
      Math.abs(veil().getBoundingClientRect().top - wrapperTop),
    ).toBeLessThan(1.5);

    // The veil blocks interaction with the stale rows and announces itself.
    expect(getComputedStyle(veil()).pointerEvents).not.toBe("none");
    expect(veil().textContent).toContain("Loading");

    // Pinned to the visible scrollport under scroll on both axes.
    const before = veil().getBoundingClientRect();
    wrapper.scrollLeft = 40;
    wrapper.scrollTop = 20;
    await expect
      .poll(() => {
        const after = veil().getBoundingClientRect();
        return (
          Math.abs(after.left - before.left) + Math.abs(after.top - before.top)
        );
      })
      .toBeLessThan(1);
  });

  test("absent while not loading", async () => {
    const screen = await render(Fixture, {
      rows: [{ id: "r1", name: "Comté", price: 89 }],
    });

    expect(screen.container.querySelector('[role="status"]')).toBeNull();
  });
});

describe("column groups", () => {
  const rows = [
    { id: "r1", name: "Comté", price: 89, added: "2026-01-03" },
    { id: "r2", name: "Rioja", price: 129, added: "2026-02-11" },
  ];

  test("adjacent columns share one spanning cell; ungrouped ones get an empty span", async () => {
    const screen = await render(Fixture, {
      rows,
      withGroups: true,
      withDateColumn: true,
    });

    const headerRows = screen.container.querySelectorAll("thead tr");
    expect(headerRows.length).toBe(2);

    const cells = [...headerRows[0].querySelectorAll("th")];
    // "Product" spans name+price; the ungrouped date column gets an empty
    // spanning cell of its own.
    expect(cells.map((cell) => cell.colSpan)).toEqual([2, 1]);
    expect(cells[0].textContent?.trim()).toBe("Product");
    expect(cells[0].getAttribute("scope")).toBe("colgroup");
    expect(cells[1].textContent?.trim()).toBe("");
  });

  test("no group on any column → no group row", async () => {
    const screen = await render(Fixture, { rows });

    expect(screen.container.querySelectorAll("thead tr").length).toBe(1);
  });

  test("the column header row sticks below the group row", async () => {
    const screen = await render(Fixture, {
      rows: [...rows, ...rows, ...rows, ...rows].map((row, index) => ({
        ...row,
        id: `${row.id}-${index}`,
      })),
      withGroups: true,
      containerClass: "h-40",
    });

    const wrapper = screen.container.querySelector("div") as HTMLElement;
    const groupRow = () =>
      screen.container.querySelector("thead tr:first-child th") as HTMLElement;
    const headerCell = () =>
      screen.container.querySelector("thead tr:nth-child(2) th") as HTMLElement;

    await expect
      .poll(() => wrapper.scrollHeight > wrapper.clientHeight)
      .toBe(true);

    const groupBottomBefore = groupRow().getBoundingClientRect().bottom;
    wrapper.scrollTop = 60;

    // Both rows pin: the group row at the top, the column headers directly
    // beneath it (measured offset), with no gap for rows to peek through.
    await expect
      .poll(() => {
        const group = groupRow().getBoundingClientRect();
        const header = headerCell().getBoundingClientRect();
        return (
          Math.abs(group.bottom - groupBottomBefore) < 1 &&
          Math.abs(header.top - group.bottom) < 1
        );
      })
      .toBe(true);
  });

  test("the group label sticks to the frozen edge under horizontal scroll", async () => {
    const screen = await render(Fixture, {
      rows,
      withGroups: true,
      withDateColumn: true,
      // Narrow: the Product span scrolls, its label must not.
      containerClass: "w-56",
    });

    const wrapper = screen.container.querySelector("div") as HTMLElement;
    await expect
      .poll(() => wrapper.scrollWidth > wrapper.clientWidth)
      .toBe(true);

    const label = () =>
      screen.container.querySelector("thead th div[title]") as HTMLElement;

    // The unscrolled label sits at the cell's padding offset and pins to
    // the frozen edge once scrolling starts — so the baseline is measured
    // AFTER pinning, then a further scroll must not move it. (Scrolled past
    // the span's slack it rides the span's right edge out, by design: the
    // year gets pushed away as the next span arrives.)
    // The stuck label keeps the cell's horizontal padding (12px at
    // comfortable density) as a gap to the frozen edge.
    wrapper.scrollLeft = 16;
    const frozenEdge =
      wrapper.getBoundingClientRect().left + wrapper.clientLeft;
    await expect
      .poll(() =>
        Math.abs(label().getBoundingClientRect().left - (frozenEdge + 12)),
      )
      .toBeLessThan(2);
    const pinned = label().getBoundingClientRect().left;

    wrapper.scrollLeft = 40;
    await expect
      .poll(() => Math.abs(label().getBoundingClientRect().left - pinned))
      .toBeLessThan(1);
  });

  test("a pinned column leaves its group and keeps its own sticky cell", async () => {
    const screen = await render(Fixture, {
      rows,
      withGroups: true,
      withPinnedPrice: true,
      withDateColumn: true,
      containerClass: "w-56",
    });

    const cells = [
      ...screen.container.querySelectorAll<HTMLTableCellElement>(
        "thead tr:first-child th",
      ),
    ];
    // Pinned price is reordered first and breaks out label-less; name keeps
    // the group with a shrunken span; the date column spans alone.
    expect(cells.map((cell) => cell.colSpan)).toEqual([1, 1, 1]);
    expect(cells.map((cell) => cell.textContent?.trim())).toEqual([
      "",
      "Product",
      "",
    ]);

    // The pinned group cell is horizontally sticky like its column.
    const wrapper = screen.container.querySelector("div") as HTMLElement;
    const before = cells[0].getBoundingClientRect().left;
    wrapper.scrollLeft = 40;
    await expect
      .poll(() => Math.abs(cells[0].getBoundingClientRect().left - before))
      .toBeLessThan(1);
  });
});

describe("initial scroll position", () => {
  const rows = [
    { id: "r1", name: "Comté", price: 89, added: "2026-01-03" },
    { id: "r2", name: "Rioja", price: 129, added: "2026-02-11" },
  ];

  function expectedLeft(container: HTMLElement, key: string) {
    const target = container.querySelector<HTMLElement>(
      `thead th[data-column="${key}"]`,
    )!;
    // Frozen edge = the leading pinned header cell(s).
    const frozen = container.querySelector<HTMLElement>(
      'thead th[data-column="price"]',
    )!.offsetWidth;
    return target.offsetLeft - frozen;
  }

  test("initialColumn lands the column after the frozen edge on mount", async () => {
    const screen = await render(Fixture, {
      rows,
      withPinnedPrice: true,
      withDateColumn: true,
      initialColumn: "added",
      containerClass: "w-56",
    });

    const wrapper = screen.container.querySelector("div") as HTMLElement;
    await expect
      .poll(
        () =>
          Math.abs(
            wrapper.scrollLeft - expectedLeft(screen.container, "added"),
          ),
        { timeout: 4000 },
      )
      .toBeLessThan(1.5);
  });

  test("a pre-mount controller.scrollToColumn is buffered and applied", async () => {
    const controller = new TableController();
    controller.scrollToColumn("added");

    const screen = await render(Fixture, {
      rows,
      controller,
      withPinnedPrice: true,
      withDateColumn: true,
      containerClass: "w-56",
    });

    const wrapper = screen.container.querySelector("div") as HTMLElement;
    await expect
      .poll(
        () =>
          Math.abs(
            wrapper.scrollLeft - expectedLeft(screen.container, "added"),
          ),
        { timeout: 4000 },
      )
      .toBeLessThan(1.5);

    // Post-mount jumps work directly.
    controller.scrollToColumn("name");
    await expect
      .poll(() =>
        Math.abs(wrapper.scrollLeft - expectedLeft(screen.container, "name")),
      )
      .toBeLessThan(1.5);
  });

  test("an editor swap restores the user's position instead of re-jumping", async () => {
    const { field: name } = fakeTextField("name");
    const { field: id } = fakeTextField("id");
    const keyed = fakeKeyedRemoteForm(() =>
      fakeEditableRemoteForm({ id: { field: id }, name: { field: name } }),
    );
    const editForm = keyed.form as unknown as NonNullable<
      ComponentProps<typeof Fixture>["editForm"]
    >;
    const controller = new TableController();

    const screen = await render(Fixture, {
      rows,
      controller,
      editForm,
      withPinnedPrice: true,
      withDateColumn: true,
      initialColumn: "added",
      containerClass: "w-56",
    });

    const wrapper = () => screen.container.querySelector("div") as HTMLElement;
    await expect.poll(() => wrapper().scrollLeft).toBeGreaterThan(10);

    // The user scrolls back to the start; opening an editor remounts the
    // markup — the position must survive, not re-jump to initialColumn.
    wrapper().scrollLeft = 0;
    await expect.poll(() => wrapper().scrollLeft).toBeLessThan(1);

    controller.startEdit("r1");
    await expect
      .poll(() => screen.container.querySelectorAll("form").length)
      .toBeGreaterThan(0);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(wrapper().scrollLeft).toBeLessThan(1);
  });
});

describe("initial scroll with expander and groups (sandbox shape)", () => {
  test("frozen edge includes the expander next to the pinned column", async () => {
    const rows = [
      { id: "r1", name: "Comté", price: 89, added: "2026-01-03" },
      { id: "r2", name: "Rioja", price: 129, added: "2026-02-11" },
    ];
    const screen = await render(Fixture, {
      rows,
      withExpanded: true,
      withPinnedPrice: true,
      withGroups: true,
      withDateColumn: true,
      initialColumn: "added",
      containerClass: "w-56",
    });

    const wrapper = screen.container.querySelector("div") as HTMLElement;
    await expect
      .poll(() => {
        const target = screen.container.querySelector<HTMLElement>(
          'thead th[data-column="added"]',
        )!;
        const headerRow = target.parentElement as HTMLTableRowElement;
        const frozen =
          headerRow.cells[0].offsetWidth + headerRow.cells[1].offsetWidth;
        return Math.abs(wrapper.scrollLeft - (target.offsetLeft - frozen));
      })
      .toBeLessThan(1.5);
  });
});
