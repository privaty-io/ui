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

  /** The current editor state — $state-backed, safe to read reactively. */
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

  /** Opens the create editor. Re-triggering while it is already open is a
   * no-op — the draft survives. Vetoed when the table has no create form. */
  startCreate(): void {
    this.#start({ type: "create" });
  }

  /** Opens the edit editor for the row with id `rowId` (as the Table's
   * `rowKey` produces it). Re-triggering the open editor is a no-op — the
   * draft survives; vetoed when the table has no edit form or no such row. */
  startEdit(rowId: RowKey): void {
    this.#start({ type: "edit", rowId });
  }

  // Registered by the attached Table: scrolls its scrollport so a column
  // lands at the frozen edge. Returns false while the scrollport is not
  // ready yet — the request stays buffered until the Table flushes it.
  #scrollTo:
    | ((key: string, options?: { behavior?: ScrollBehavior }) => boolean)
    | undefined;

  #pendingScroll:
    { key: string; options?: { behavior?: ScrollBehavior } } | undefined;

  /**
   * Scrolls the attached Table horizontally so the column with `key` lands
   * at the left edge of the scrolling region — just after the expander and
   * any left-pinned columns. Fired before the Table has mounted, the
   * request is buffered and applied once its scrollport is ready (this is
   * how an initial position works). Unknown keys are ignored. `behavior:
   * "smooth"` animates — the default jumps instantly.
   */
  scrollToColumn(key: string, options?: { behavior?: ScrollBehavior }): void {
    if (this.#scrollTo?.(key, options)) return;
    this.#pendingScroll = { key, options };
  }

  /** Returns to idle. Safe to call when already idle. Any open draft is
   * effectively dropped — the next trigger reseeds its editor's fields. */
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

  /**
   * Internal — called by the Table whenever its scrollport (re)attaches.
   * Applies a scroll request that was fired before the Table was ready.
   */
  flushScroll(): void {
    if (!this.#pendingScroll || !this.#scrollTo) return;

    if (this.#scrollTo(this.#pendingScroll.key, this.#pendingScroll.options)) {
      this.#pendingScroll = undefined;
    }
  }

  /** Internal — called by the Table. Not part of the consumer API. */
  attach(
    prepare: (editor: TableEditor) => boolean,
    onTransition?: () => void,
    scrollTo?: (
      key: string,
      options?: { behavior?: ScrollBehavior },
    ) => boolean,
  ): () => void {
    if (this.#prepare)
      throw new Error(
        "TableController: a controller can only drive one <Table>",
      );

    this.#prepare = prepare;
    this.#onTransition = onTransition;
    this.#scrollTo = scrollTo;

    return () => {
      this.#prepare = undefined;
      this.#onTransition = undefined;
      this.#scrollTo = undefined;
      this.#pendingScroll = undefined;
      this.#preparedKey = undefined;
    };
  }
}

export { TableController };
