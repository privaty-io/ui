import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import type { ComponentProps } from "svelte";

import { fakeTextField } from "@privaty/ui-forms/testing/fakes.svelte.js";
import Fixture from "./table-nested.fixture.svelte";
import {
  fakeEditableRemoteForm,
  fakeKeyedRemoteForm,
} from "./testing/fakes.svelte";

type FixtureProps = ComponentProps<typeof Fixture>;

function parents() {
  return [
    {
      id: "p1",
      name: "Comté",
      children: [
        { id: "c1", label: "Batch 12" },
        { id: "c2", label: "Batch 19" },
      ],
    },
  ];
}

describe("nested table editing", () => {
  test("outer create/edit with the nested table expanded", async () => {
    const name = fakeTextField("name");
    const id = fakeTextField("id");
    const outerKeyed = fakeKeyedRemoteForm(() =>
      fakeEditableRemoteForm({ id, name }),
    );
    const outerCreate = fakeEditableRemoteForm({
      name: fakeTextField("name"),
    });
    const innerLabel = fakeTextField("label");
    const innerCreate = fakeEditableRemoteForm({ label: innerLabel });

    const screen = await render(Fixture, {
      rows: parents(),
      outerCreateForm: outerCreate.form as unknown as NonNullable<
        FixtureProps["outerCreateForm"]
      >,
      outerEditForm: outerKeyed.form as unknown as NonNullable<
        FixtureProps["outerEditForm"]
      >,
      innerCreateForm: innerCreate.form as unknown as NonNullable<
        FixtureProps["innerCreateForm"]
      >,
    });

    // Expand the parent so the nested table is mounted, then walk the
    // outer table through create and edit — the whole outer markup
    // remounts inside a <Form>, nested table included.
    await screen.getByRole("button", { name: "Expand row" }).click();
    await expect.element(screen.getByTestId("nested-p1")).toBeInTheDocument();

    await screen.getByRole("button", { name: "Add" }).first().click();
    await expect.element(screen.getByLabelText("Name")).toBeInTheDocument();
    await screen.getByRole("button", { name: "Cancel" }).click();

    await screen.getByRole("button", { name: "Edit" }).first().click();
    await expect.element(screen.getByLabelText("Name")).toHaveValue("Comté");
    await screen.getByRole("button", { name: "Cancel" }).click();

    // And the inner table still opens ITS editor afterwards.
    await screen
      .getByTestId("nested-p1")
      .getByRole("button", { name: "Add" })
      .click();
    await expect.element(screen.getByLabelText("Label")).toBeInTheDocument();
  });

  test("hiddenFields render external values as hidden inputs", async () => {
    const label = fakeTextField("label");
    const parentId = fakeTextField("parentId");
    const instance = fakeEditableRemoteForm({ label, parentId });
    const screen = await render(Fixture, {
      rows: parents(),
      innerHiddenFields: [
        { key: "parentId", value: "p1" },
        // Not in the form's fields — skipped, not thrown: create and edit
        // schemas may declare different subsets.
        { key: "missing", value: "x" },
      ],
      innerCreateForm: instance.form as unknown as NonNullable<
        FixtureProps["innerCreateForm"]
      >,
    });

    await screen.getByRole("button", { name: "Expand row" }).click();
    await screen
      .getByTestId("nested-p1")
      .getByRole("button", { name: "Add" })
      .click();
    await expect.element(screen.getByLabelText("Label")).toBeInTheDocument();

    const hidden = screen.container.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="parentId"]',
    );
    expect(hidden).not.toBeNull();
    expect(hidden!.value).toBe("p1");
    expect(screen.container.querySelector('input[name="missing"]')).toBeNull();
  });

  test("an editing ancestor refuses descendant editors", async () => {
    const name = fakeTextField("name");
    const id = fakeTextField("id");
    const outerKeyed = fakeKeyedRemoteForm(() =>
      fakeEditableRemoteForm({ id, name }),
    );
    const innerCreate = fakeEditableRemoteForm({
      label: fakeTextField("label"),
    });

    const screen = await render(Fixture, {
      rows: parents(),
      outerEditForm: outerKeyed.form as unknown as NonNullable<
        FixtureProps["outerEditForm"]
      >,
      innerCreateForm: innerCreate.form as unknown as NonNullable<
        FixtureProps["innerCreateForm"]
      >,
    });

    await screen.getByRole("button", { name: "Expand row" }).click();
    await screen.getByRole("button", { name: "Edit" }).first().click();
    await expect.element(screen.getByLabelText("Name")).toHaveValue("Comté");

    // The outer <form> wraps this whole subtree — a second form element
    // inside it would corrupt both submits, so the open is refused.
    await screen
      .getByTestId("nested-p1")
      .getByRole("button", { name: "Add" })
      .click();

    await expect
      .element(screen.getByLabelText("Label"))
      .not.toBeInTheDocument();
    await expect.element(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  test("opening the ancestor's editor closes an open descendant editor", async () => {
    const name = fakeTextField("name");
    const id = fakeTextField("id");
    const outerKeyed = fakeKeyedRemoteForm(() =>
      fakeEditableRemoteForm({ id, name }),
    );
    const innerCreate = fakeEditableRemoteForm({
      label: fakeTextField("label"),
    });

    const screen = await render(Fixture, {
      rows: parents(),
      outerEditForm: outerKeyed.form as unknown as NonNullable<
        FixtureProps["outerEditForm"]
      >,
      innerCreateForm: innerCreate.form as unknown as NonNullable<
        FixtureProps["innerCreateForm"]
      >,
    });

    await screen.getByRole("button", { name: "Expand row" }).click();
    await screen
      .getByTestId("nested-p1")
      .getByRole("button", { name: "Add" })
      .click();
    await expect.element(screen.getByLabelText("Label")).toBeInTheDocument();

    // Mirrors a second editor within ONE table closing the first.
    await screen.getByRole("button", { name: "Edit" }).first().click();

    await expect
      .element(screen.getByLabelText("Label"))
      .not.toBeInTheDocument();
    await expect.element(screen.getByLabelText("Name")).toHaveValue("Comté");
  });

  test("the inner table opens its create editor", async () => {
    const label = fakeTextField("label");
    const instance = fakeEditableRemoteForm({ label });
    const screen = await render(Fixture, {
      rows: parents(),
      innerCreateForm: instance.form as unknown as NonNullable<
        FixtureProps["innerCreateForm"]
      >,
    });

    // Expand the parent row, then open the nested table's create editor.
    await screen.getByRole("button", { name: "Expand row" }).click();
    await expect.element(screen.getByTestId("nested-p1")).toBeInTheDocument();

    await screen.getByRole("button", { name: "Add" }).click();

    await expect.element(screen.getByLabelText("Label")).toBeInTheDocument();
  });

  test("the inner table opens its edit editor", async () => {
    const label = fakeTextField("label");
    const id = fakeTextField("id");
    const keyed = fakeKeyedRemoteForm(() =>
      fakeEditableRemoteForm({ id, label }),
    );
    const screen = await render(Fixture, {
      rows: parents(),
      innerEditForm: keyed.form as unknown as NonNullable<
        FixtureProps["innerEditForm"]
      >,
    });

    await screen.getByRole("button", { name: "Expand row" }).click();
    await expect.element(screen.getByTestId("nested-p1")).toBeInTheDocument();

    await screen.getByRole("button", { name: "Edit" }).first().click();

    await expect
      .element(screen.getByLabelText("Label"))
      .toHaveValue("Batch 12");
  });
});
