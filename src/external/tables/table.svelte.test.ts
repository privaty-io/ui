import type { ComponentProps } from "svelte";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeTextField } from "#privaty/ui-forms/testing/fakes.svelte.js";
import Fixture from "./table.fixture.svelte";
import { TableController } from "./table-controller.svelte";
import {
  fakeEditableRemoteForm,
  fakeKeyedRemoteForm,
} from "./testing/fakes.svelte";

type FixtureProps = ComponentProps<typeof Fixture>;

function items() {
  return [
    { id: "r2", name: "Rioja", price: 129 },
    { id: "r1", name: "Comté", price: 89 },
    { id: "r3", name: "Sourdough", price: 42 },
  ];
}

function makeCreateForm() {
  const name = fakeTextField("name");
  const instance = fakeEditableRemoteForm({ name });

  return {
    name,
    createForm: instance.form as unknown as NonNullable<
      FixtureProps["createForm"]
    >,
  };
}

function makeEditForm() {
  const name = fakeTextField("name");
  const id = fakeTextField("id");
  const keyed = fakeKeyedRemoteForm(() => fakeEditableRemoteForm({ id, name }));

  return {
    name,
    id,
    editForm: keyed.form as unknown as NonNullable<FixtureProps["editForm"]>,
  };
}

function firstCells(container: Element): string[] {
  return [...container.querySelectorAll("tbody tr")].map(
    (row) => row.querySelector("td")?.textContent?.trim() ?? "",
  );
}

describe("display", () => {
  test("renders headers and cells from the registered columns", async () => {
    const screen = await render(Fixture, { rows: items() });

    await expect.element(screen.getByText("Name")).toBeInTheDocument();
    await expect.element(screen.getByText("Price")).toBeInTheDocument();
    await expect.element(screen.getByText("Rioja")).toBeInTheDocument();

    // Without forms or a custom actions snippet there is no actions column.
    await expect.element(screen.getByText("Actions")).not.toBeInTheDocument();
  });

  test("renders custom cell snippets with the column value", async () => {
    const screen = await render(Fixture, { rows: items() });

    await expect.element(screen.getByText("129 kr")).toBeInTheDocument();
  });

  test("renders a custom actions snippet per display row", async () => {
    const screen = await render(Fixture, {
      rows: items(),
      withCustomActions: true,
    });

    await expect.element(screen.getByText("Actions")).toBeInTheDocument();
    await expect.element(screen.getByText("Zap Rioja")).toBeInTheDocument();
    await expect.element(screen.getByText("Zap Sourdough")).toBeInTheDocument();
  });
});

describe("sorting", () => {
  test("cycles a text column: ascending, descending, off", async () => {
    const screen = await render(Fixture, { rows: items() });
    const header = screen.getByRole("button", { name: "Name" });

    await header.click();
    await expect
      .poll(() => firstCells(screen.container))
      .toEqual(["Comté", "Rioja", "Sourdough"]);

    await header.click();
    await expect
      .poll(() => firstCells(screen.container))
      .toEqual(["Sourdough", "Rioja", "Comté"]);

    await header.click();
    await expect
      .poll(() => firstCells(screen.container))
      .toEqual(["Rioja", "Comté", "Sourdough"]);
  });

  test("sorts numeric columns numerically", async () => {
    const screen = await render(Fixture, { rows: items() });

    await screen.getByRole("button", { name: "Price" }).click();

    await expect
      .poll(() => firstCells(screen.container))
      .toEqual(["Sourdough", "Comté", "Rioja"]);
  });
});

describe("editing", () => {
  test("opens a seeded editor row through the default Edit button", async () => {
    const { editForm, name, id } = makeEditForm();
    const screen = await render(Fixture, { rows: items(), editForm });

    // The internal controller drives this — no controller prop passed.
    await screen.getByRole("button", { name: "Edit" }).first().click();

    const input = screen.getByLabelText("Name");
    await expect.element(input).toHaveValue("Rioja");
    expect(name.field.value()).toBe("Rioja");
    expect(id.field.value()).toBe("r2");

    await expect
      .element(screen.getByRole("button", { name: "Save" }))
      .toBeInTheDocument();
    expect(
      screen.container.querySelector('input[type="hidden"][name="id"]'),
    ).not.toBeNull();
  });

  test("cancel returns to display rows", async () => {
    const { editForm } = makeEditForm();
    const controller = new TableController();
    const screen = await render(Fixture, {
      rows: items(),
      editForm,
      controller,
    });

    controller.startEdit("r2");
    await expect.element(screen.getByLabelText("Name")).toBeInTheDocument();

    await screen.getByRole("button", { name: "Cancel" }).click();

    await expect.element(screen.getByLabelText("Name")).not.toBeInTheDocument();
    expect(controller.editor).toEqual({ type: "idle" });
  });

  test("reseeds the draft when an editor is re-entered", async () => {
    const { editForm, name } = makeEditForm();
    const controller = new TableController();
    await render(Fixture, { rows: items(), editForm, controller });

    controller.startEdit("r2");
    name.edit("half-typed garbage");
    controller.close();

    controller.startEdit("r2");

    expect(name.field.value()).toBe("Rioja");
  });

  test("vetoes editing an unknown row", async () => {
    const { editForm } = makeEditForm();
    const controller = new TableController();
    const screen = await render(Fixture, {
      rows: items(),
      editForm,
      controller,
    });

    controller.startEdit("missing");

    expect(controller.editor).toEqual({ type: "idle" });
    await expect.element(screen.getByLabelText("Name")).not.toBeInTheDocument();
  });

  test("gates Save on dirty, then closes the editor on success", async () => {
    const { editForm, name } = makeEditForm();
    const controller = new TableController();
    const screen = await render(Fixture, {
      rows: items(),
      editForm,
      controller,
    });

    controller.startEdit("r2");

    const save = screen.getByRole("button", { name: "Save" });
    // Seeded pristine — nothing to save yet.
    await expect.element(save).toBeDisabled();

    name.edit("Ribera");
    await expect.element(save).not.toBeDisabled();

    await save.click();

    await expect.element(screen.getByLabelText("Name")).not.toBeInTheDocument();
    expect(controller.editor).toEqual({ type: "idle" });
  });

  test("switching editors directly replaces the session", async () => {
    const { editForm, name } = makeEditForm();
    const controller = new TableController();
    const screen = await render(Fixture, {
      rows: items(),
      editForm,
      controller,
    });

    controller.startEdit("r2");
    await expect.element(screen.getByLabelText("Name")).toHaveValue("Rioja");

    controller.startEdit("r1");

    await expect.element(screen.getByLabelText("Name")).toHaveValue("Comté");
    expect(name.field.value()).toBe("Comté");
  });

  test("non-editable columns show their value as text while editing", async () => {
    const { editForm } = makeEditForm();
    const controller = new TableController();
    const screen = await render(Fixture, {
      rows: items(),
      editForm,
      controller,
    });

    controller.startEdit("r2");

    await expect.element(screen.getByText("129 kr")).toBeInTheDocument();
  });
});

describe("creating", () => {
  test("startCreate pins an empty editor row at the top", async () => {
    const { createForm } = makeCreateForm();
    const controller = new TableController();
    const screen = await render(Fixture, {
      rows: items(),
      createForm,
      controller,
    });

    controller.startCreate();

    const input = screen.getByLabelText("Name");
    await expect.element(input).toHaveValue("");
    await expect
      .element(screen.getByRole("button", { name: "Add" }))
      .toBeInTheDocument();

    // The create editor is the first body row.
    const first = screen.container.querySelector("tbody tr");
    expect(first?.querySelector("input")).not.toBeNull();
  });

  test("vetoes creating without a create form", async () => {
    const { editForm } = makeEditForm();
    const controller = new TableController();
    await render(Fixture, { rows: items(), editForm, controller });

    controller.startCreate();

    expect(controller.editor).toEqual({ type: "idle" });
  });
});
