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

  // Runs synchronously before ANY editor transition flips state — while the
  // outgoing DOM is still live. The Table uses it to capture scroll position
  // (teardown hooks fire too late: attachment cleanup sees a disconnected
  // element).
  #onTransition: (() => void) | undefined;

  // The editor key the attached Table last successfully prepared for. The
  // draft-preserving no-op on re-triggering the OPEN editor only applies
  // when that editor was actually prepared — otherwise a stale state (e.g.
  // flipped before the Table attached) would deadlock its own re-trigger.
  #preparedKey: string | undefined;

  get editor(): TableEditor {
    return this.#editor;
  }

  #keyFor(editor: TableEditor): string | undefined {
    if (editor.type === "create") return "create";
    if (editor.type === "edit") return `edit:${String(editor.rowId)}`;
    return undefined;
  }

  #start(editor: TableEditor): void {
    const key = this.#keyFor(editor);

    // Re-triggering the open, prepared editor must not discard its draft.
    if (key !== undefined && key === this.#preparedKey) return;

    this.#onTransition?.();

    if (this.#prepare) {
      if (!this.#prepare(editor)) return;
      this.#preparedKey = key;
    }

    this.#editor = editor;
  }

  startCreate(): void {
    this.#start({ type: "create" });
  }

  startEdit(rowId: RowKey): void {
    this.#start({ type: "edit", rowId });
  }

  close(): void {
    if (this.#editor.type !== "idle") this.#onTransition?.();
    this.#preparedKey = undefined;
    this.#editor = { type: "idle" };
  }

  /**
   * Internal — called by the attached Table once its columns have
   * registered. Honours an editor state that was set before the Table could
   * prepare it (a pre-attach trigger): prepares it now, or closes if the
   * table cannot honour it.
   */
  resync(): void {
    if (this.#editor.type === "idle" || !this.#prepare) return;

    const key = this.#keyFor(this.#editor);
    if (key === this.#preparedKey) return;

    this.#onTransition?.();

    if (this.#prepare(this.#editor)) {
      this.#preparedKey = key;
    } else {
      this.close();
    }
  }

  /** Internal — called by the Table. Not part of the consumer API. */
  attach(
    prepare: (editor: TableEditor) => boolean,
    onTransition?: () => void,
  ): () => void {
    if (this.#prepare)
      throw new Error(
        "TableController: a controller can only drive one <Table>",
      );

    this.#prepare = prepare;
    this.#onTransition = onTransition;

    return () => {
      this.#prepare = undefined;
      this.#onTransition = undefined;
      this.#preparedKey = undefined;
    };
  }
}

export { TableController };
