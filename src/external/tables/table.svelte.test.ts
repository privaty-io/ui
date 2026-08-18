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
  // Full-width rows (the filler/empty row and expanded content) span all
  // columns — they are not data rows.
  return [...container.querySelectorAll("tbody tr")]
    .filter((row) => !row.querySelector("td[colspan]"))
    .map((row) => row.querySelector("td")?.textContent?.trim() ?? "");
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

    // Two Add buttons while creating: the header trigger (disabled while the
    // editor is open) and the create row's submit (disabled too — pristine,
    // gated until dirty-and-valid).
    const addButtons = screen.getByRole("button", { name: "Add" });
    await expect.element(addButtons.first()).toBeDisabled();
    await expect.element(addButtons.nth(1)).toHaveAttribute("type", "submit");

    // The create editor is the first body row.
    const first = screen.container.querySelector("tbody tr");
    expect(first?.querySelector("input")).not.toBeNull();
  });

  test("the header Add button opens the create editor", async () => {
    const { createForm } = makeCreateForm();
    const screen = await render(Fixture, { rows: items(), createForm });

    await screen.getByRole("button", { name: "Add" }).click();

    await expect.element(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  test("vetoes creating without a create form", async () => {
    const { editForm } = makeEditForm();
    const controller = new TableController();
    await render(Fixture, { rows: items(), editForm, controller });

    controller.startCreate();

    expect(controller.editor).toEqual({ type: "idle" });
  });
});

describe("expansion", () => {
  test("renders an expander per row and toggles its content", async () => {
    const screen = await render(Fixture, {
      rows: items(),
      withExpanded: true,
    });

    const expanders = screen.getByRole("button", { name: "Expand row" });
    expect(expanders.elements().length).toBe(3);

    await expanders.first().click();

    await expect
      .element(screen.getByText("Details for Rioja"))
      .toBeInTheDocument();
    await expect
      .element(expanders.first())
      .toHaveAttribute("aria-expanded", "true");

    // Expanded content sticks to the scrollport instead of riding the
    // table's horizontal scroll.
    const content = screen.container.querySelector("td[colspan] div.sticky");
    expect(content?.textContent).toContain("Details for Rioja");

    await expanders.first().click();

    await expect
      .element(screen.getByText("Details for Rioja"))
      .not.toBeInTheDocument();
  });

  test("multiple rows can be expanded at once", async () => {
    const screen = await render(Fixture, {
      rows: items(),
      withExpanded: true,
    });

    const expanders = screen.getByRole("button", { name: "Expand row" });
    await expanders.first().click();
    await expanders.nth(1).click();

    await expect
      .element(screen.getByText("Details for Rioja"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Details for Comté"))
      .toBeInTheDocument();
  });
});

describe("layout", () => {
  test("header cells are sticky", async () => {
    const screen = await render(Fixture, { rows: items() });

    const header = screen.container.querySelector("thead th");
    expect(header?.className).toMatch(/(?:^|\s)sticky(?:\s|$)/);
    expect(header?.className).toMatch(/(?:^|\s)top-0(?:\s|$)/);
  });

  test("editor cells shed vertical padding to keep row heights level", async () => {
    const { editForm } = makeEditForm();
    const controller = new TableController();
    const screen = await render(Fixture, {
      rows: items(),
      editForm,
      controller,
    });

    controller.startEdit("r2");

    const input = screen.getByLabelText("Name");
    await expect.element(input).toBeInTheDocument();

    const cell = screen.container
      .querySelector('input[name="name"]')
      ?.closest("td");
    expect(cell?.className).toMatch(/(?:^|\s)py-0\.5(?:\s|$)/);
  });

  test("compact density tightens padding and type", async () => {
    const screen = await render(Fixture, {
      rows: items(),
      density: "compact",
    });

    const cell = screen.container.querySelector("tbody td");
    expect(cell?.className).toMatch(/(?:^|\s)px-2(?:\s|$)/);
    expect(screen.container.querySelector("table")?.className).toMatch(
      /(?:^|\s)text-sm(?:\s|$)/,
    );
  });

  test("compact density reaches editor inputs through the core context", async () => {
    const { editForm } = makeEditForm();
    const controller = new TableController();
    const screen = await render(Fixture, {
      rows: items(),
      editForm,
      controller,
      density: "compact",
    });

    controller.startEdit("r2");

    const input = screen.getByLabelText("Name");
    await expect.element(input).toHaveClass(/(?:^|\s)text-sm(?:\s|$)/);
    await expect.element(input).toHaveClass(/(?:^|\s)py-0\.5(?:\s|$)/);
  });

  test("pinned columns move to their edge with a sticky offset", async () => {
    const screen = await render(Fixture, {
      rows: items(),
      withPinnedPrice: true,
    });

    // Price is declared second but pinned left — it becomes the first
    // column.
    await expect
      .poll(() => firstCells(screen.container))
      .toEqual(["129 kr", "89 kr", "42 kr"]);

    const header = screen.container.querySelector("thead th");
    expect(header?.textContent).toContain("Price");
    expect(header?.getAttribute("style")).toContain("width: 8rem");
    expect(header?.getAttribute("style")).toContain("left: 0px");

    const cell = screen.container.querySelector("tbody td");
    expect(cell?.className).toMatch(/(?:^|\s)sticky(?:\s|$)/);
    expect(cell?.getAttribute("style")).toContain("left: 0px");

    // The pinned/scrolling boundary carries the only column border.
    expect(cell?.className).toMatch(/(?:^|\s)border-r(?:\s|$)/);
  });

  test("width-constrained cells truncate and expose the text as a tooltip", async () => {
    const screen = await render(Fixture, {
      rows: items(),
      withPinnedPrice: true,
    });

    const cell = screen.container.querySelector('tbody td[title="129"]');
    expect(cell?.querySelector("span")?.className).toMatch(
      /(?:^|\s)truncate(?:\s|$)/,
    );
  });

  test("every data cell carries a tooltip, width-constrained or not", async () => {
    const screen = await render(Fixture, { rows: items() });

    // The name column has no width — the tooltip defaults to the raw value.
    expect(
      screen.container.querySelector('tbody td[title="Rioja"]'),
    ).not.toBeNull();
  });
});

describe("empty state", () => {
  test("shows the default empty message in the filler row", async () => {
    const screen = await render(Fixture, { rows: [] });

    await expect.element(screen.getByText("No rows")).toBeInTheDocument();
  });

  test("shows no empty message when rows exist", async () => {
    const screen = await render(Fixture, { rows: items() });

    await expect.element(screen.getByText("No rows")).not.toBeInTheDocument();
  });

  test("yields to the create editor", async () => {
    const { createForm } = makeCreateForm();
    const controller = new TableController();
    const screen = await render(Fixture, { rows: [], createForm, controller });

    await expect.element(screen.getByText("No rows")).toBeInTheDocument();

    controller.startCreate();
    await expect.element(screen.getByText("No rows")).not.toBeInTheDocument();

    controller.close();
    await expect.element(screen.getByText("No rows")).toBeInTheDocument();
  });
});
