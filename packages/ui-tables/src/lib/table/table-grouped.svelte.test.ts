import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import type { ComponentProps } from "svelte";

import { fakeNumberField, fakeTextField } from "@privaty/ui-forms/testing";
import Fixture from "./table-grouped.fixture.svelte";
import {
  fakeEditableRemoteForm,
  fakeKeyedRemoteForm,
} from "../testing/fakes.svelte";

type FixtureProps = ComponentProps<typeof Fixture>;

function rows() {
  return [
    { id: "a1", employee: "Lukas", months: { "2026-01": 12, "2026-02": 34 } },
  ];
}

/** A months array field the way Kit's fields proxy shapes it —
 * fields.months[i].month / fields.months[i].hours. */
function makeMonthsField() {
  const entries = [0, 1].map((index) => ({
    month: fakeTextField(`months[${index}].month`),
    hours: fakeNumberField(`months[${index}].hours`),
  }));
  return {
    entries,
    handle: {
      field: entries.map((entry) => ({
        month: entry.month.field,
        hours: entry.hours.field,
      })),
    },
  };
}

describe("grouped editor fields", () => {
  test("edit: seeds every entry and renders the hidden key inputs", async () => {
    const employee = fakeTextField("employee");
    const id = fakeTextField("id");
    const months = makeMonthsField();
    const keyed = fakeKeyedRemoteForm(() =>
      fakeEditableRemoteForm({ id, employee, months: months.handle }),
    );

    const screen = await render(Fixture, {
      rows: rows(),
      editForm: keyed.form as unknown as NonNullable<FixtureProps["editForm"]>,
    });

    await screen.getByRole("button", { name: "Edit" }).click();
    await expect
      .element(screen.getByLabelText("Employee"))
      .toHaveValue("Lukas");

    // Each grouped column's editor edits its entry's VALUE subfield,
    // seeded from the row via the column's value accessor…
    await expect.element(screen.getByLabelText("2026-01")).toHaveValue(12);
    await expect.element(screen.getByLabelText("2026-02")).toHaveValue(34);
    expect(months.entries[0].hours.field.value()).toBe(12);
    expect(months.entries[1].hours.field.value()).toBe(34);

    // …and the KEY subfield rides along as a hidden input, seeded with the
    // column's entry key — Kit reassembles fields.months[i] into the array
    // the handler receives.
    const january = screen.container.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="months[0].month"]',
    );
    const february = screen.container.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="months[1].month"]',
    );
    expect(january?.value).toBe("2026-01");
    expect(february?.value).toBe("2026-02");
    expect(months.entries[0].month.field.value()).toBe("2026-01");
    expect(months.entries[1].month.field.value()).toBe("2026-02");
  });

  test("create: createSeed seeds the values; keys are still the columns'", async () => {
    const employee = fakeTextField("employee");
    const months = makeMonthsField();
    const instance = fakeEditableRemoteForm({
      employee,
      months: months.handle,
    });

    const screen = await render(Fixture, {
      rows: rows(),
      createForm: instance.form as unknown as NonNullable<
        FixtureProps["createForm"]
      >,
    });

    await screen.getByRole("button", { name: "Add" }).click();
    await expect.element(screen.getByLabelText("Employee")).toBeInTheDocument();

    expect(months.entries[0].hours.field.value()).toBe(0);
    expect(months.entries[1].hours.field.value()).toBe(0);
    expect(months.entries[0].month.field.value()).toBe("2026-01");
    expect(
      screen.container.querySelector('input[name="months[1].month"]'),
    ).not.toBeNull();
  });
});
