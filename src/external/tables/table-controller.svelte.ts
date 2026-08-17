import type { RowKey, TableEditor } from "./types";

/**
 * The imperative surface of a Table: hold a controller anywhere — a toolbar,
 * another component, a navigation handler — and trigger the table's editors
 * from it. Exactly one editor is active at a time; starting a new one
 * silently drops the previous draft.
 */
class TableController {
  #editor = $state<TableEditor>({ type: "idle" });

  // Registered by the attached Table: reseeds the target editor's fields
  // (cached remote form instances resurrect old drafts otherwise) and vetoes
  // triggers the table cannot honour (unknown row, no form configured).
  // Triggers fired before a Table attaches flip state unprepared — the
  // Table's template falls back to display rows when it cannot honour the
  // editor state, so nothing breaks, but no reseeding happens either.
  #prepare: ((editor: TableEditor) => boolean) | undefined;

  get editor(): TableEditor {
    return this.#editor;
  }

  startCreate(): void {
    if (this.#editor.type === "create") return;
    if (this.#prepare && !this.#prepare({ type: "create" })) return;

    this.#editor = { type: "create" };
  }

  startEdit(rowId: RowKey): void {
    // Re-triggering the open editor must not discard its own draft.
    if (this.#editor.type === "edit" && this.#editor.rowId === rowId) return;
    if (this.#prepare && !this.#prepare({ type: "edit", rowId })) return;

    this.#editor = { type: "edit", rowId };
  }

  close(): void {
    this.#editor = { type: "idle" };
  }

  /** Internal — called by the Table. Not part of the consumer API. */
  attach(prepare: (editor: TableEditor) => boolean): () => void {
    if (this.#prepare)
      throw new Error(
        "TableController: a controller can only drive one <Table>",
      );

    this.#prepare = prepare;

    return () => {
      this.#prepare = undefined;
    };
  }
}

export { TableController };
