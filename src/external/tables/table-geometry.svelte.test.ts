import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import type { ComponentProps } from "svelte";
import { fakeTextField } from "#privaty/ui-forms/testing/fakes.svelte.js";
import Fixture from "./table.fixture.svelte";
import { TableController } from "./table-controller.svelte";
import {
  fakeEditableRemoteForm,
  fakeKeyedRemoteForm,
} from "./testing/fakes.svelte";
import "#privaty/ui/testing/tailwind.css";

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
