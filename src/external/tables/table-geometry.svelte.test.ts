import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Fixture from "./table.fixture.svelte";
import "./testing/tailwind.css";

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
