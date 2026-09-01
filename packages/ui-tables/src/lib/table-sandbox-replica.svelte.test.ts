// Full replica of the playground sandbox's table shape — the environment
// where the initial-scroll overshoot was reported: expander + pinned column
// + actions (real-ish forms) + year groups over {#each}-generated quarter
// columns + a large row set + smooth controller jumps.
import "@privaty/ui/testing/tailwind.css";

import type { ComponentProps } from "svelte";
import { fakeTextField } from "@privaty/ui-forms/testing/fakes.svelte.js";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Fixture from "./table.fixture.svelte";
import { TableController } from "./table-controller.svelte";
import {
  fakeEditableRemoteForm,
  fakeKeyedRemoteForm,
} from "./testing/fakes.svelte";

const rows = Array.from({ length: 24 }, (_, index) => ({
  id: `seed-${index}`,
  name: `Cheese №${index}`,
  price: 49 + ((index * 37) % 160),
}));

function setup() {
  const keyed = fakeKeyedRemoteForm(() =>
    fakeEditableRemoteForm({
      id: fakeTextField("id"),
      name: fakeTextField("name"),
    }),
  );
  const editForm = keyed.form as unknown as NonNullable<
    ComponentProps<typeof Fixture>["editForm"]
  >;
  return { editForm, controller: new TableController() };
}

function expected(container: HTMLElement, key: string) {
  const target = container.querySelector<HTMLElement>(
    `thead th[data-column="${CSS.escape(key)}"]`,
  )!;
  const headerRow = target.parentElement as HTMLTableRowElement;
  // expander + pinned price = the frozen edge.
  const frozen =
    headerRow.cells[0].offsetWidth + headerRow.cells[1].offsetWidth;
  return target.offsetLeft - frozen;
}

describe("sandbox replica", () => {
  test("initialColumn and smooth jumps subtract the frozen edge", async () => {
    const { editForm, controller } = setup();
    const screen = await render(Fixture, {
      rows,
      controller,
      editForm,
      ondelete: () => {},
      withExpanded: true,
      withPinnedPrice: true,
      withGroups: true,
      withQuarterColumns: true,
      initialColumn: "2026-q1",
      containerClass: "w-[36rem] h-96",
    });

    const wrapper = screen.container.querySelector("div") as HTMLElement;

    // Tolerance 3: Firefox's smooth-scroll animation settles a couple of
    // fractional px off the target — visually invisible.
    await expect
      .poll(
        () =>
          Math.abs(wrapper.scrollLeft - expected(screen.container, "2026-q1")),
        { timeout: 4000 },
      )
      .toBeLessThan(3);

    // The smooth jump the sandbox buttons use — the animation runs
    // headless too.
    controller.scrollToColumn("2027-q1", { behavior: "smooth" });
    await expect
      .poll(
        () =>
          Math.abs(wrapper.scrollLeft - expected(screen.container, "2027-q1")),
        { timeout: 4000 },
      )
      .toBeLessThan(3);

    // A late initial re-anchor (fonts resolving slowly) must NOT yank this
    // jump back to initialColumn — the jump took ownership.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(
      Math.abs(wrapper.scrollLeft - expected(screen.container, "2027-q1")),
    ).toBeLessThan(3);

    controller.scrollToColumn("2026-q1");
    await expect
      .poll(() =>
        Math.abs(wrapper.scrollLeft - expected(screen.container, "2026-q1")),
      )
      .toBeLessThan(3);
  });
});
