<!-- @component
Data table with self-registering <Column> children, sticky headers, pinned
columns, tri-state client-side sorting, row expansion, and inline CRUD editing
built on remote forms. Actions appear by presence — Edit with editForm, the
header Add button with createForm, Delete with ondelete — and exactly one
editor is open at a time; switching drops the open draft silently. Fully
server-renderable; the root is h-full and scrolls internally, so give the
surrounding container a height.
-->
<script
  lang="ts"
  generics="Row, CreateInput extends RemoteFormInput = RemoteFormInput, CreateOutput = unknown, EditInput extends RemoteFormInput = RemoteFormInput, EditOutput = unknown"
>
  import FormError from "@privaty/ui-forms/components/form-error.svelte";
  import Reset from "@privaty/ui-forms/components/reset.svelte";
  import Submit from "@privaty/ui-forms/components/submit.svelte";
  import Form from "@privaty/ui-forms/form.svelte";
  import { cn } from "@privaty/ui/cn.js";
  import Button from "@privaty/ui/components/button.svelte";
  import Spinner from "@privaty/ui/components/spinner.svelte";
  import { getUiConfig } from "@privaty/ui/config/context.js";
  import {
    getUiDensity,
    setUiDensity,
    type UiDensity,
  } from "@privaty/ui/config/density.js";
  import type { RemoteForm, RemoteFormInput } from "$app/server";
  import {
    CheckIcon,
    ChevronRightIcon,
    PencilIcon,
    PlusIcon,
    RotateCcwIcon,
    Trash2Icon,
    XIcon,
  } from "@lucide/svelte";
  import type { StandardSchemaV1 } from "@standard-schema/spec";
  import { onDestroy, onMount, type Snippet } from "svelte";
  import { SvelteMap, SvelteSet } from "svelte/reactivity";
  import {
    getTableTree,
    setTableContext,
    setTableTree,
    type TableTreeNode,
  } from "./context";
  import { tableTheme } from "./theme";
  import { TableController } from "./table-controller.svelte";
  import type {
    ColumnRegistration,
    EditorField,
    HiddenField,
    HiddenFieldAttributes,
    RowsSource,
    TableEditor,
  } from "./types";

  // The exact key type `.for()` accepts — Kit derives it from the edit
  // schema's `id` field (falling back to string | number without one).
  type EditRowKey = Parameters<RemoteForm<EditInput, EditOutput>["for"]>[0];

  type Props = {
    /** The data to display: a plain array, or a reactive rows SOURCE —
     * the `{ current, loading }` slice of a Kit remote query, so
     * `rows={getRows()}` works directly. With a source the table renders
     * immediately and veils itself while the query loads: an un-awaited
     * query SSRs the loading state (`current` is always undefined on the
     * server) and the client fills the rows in when the fetch lands. For
     * fully server-rendered rows, keep awaiting the query and pass the
     * array (see the README's data recipes). Sorting copies — the array
     * is never mutated. */
    rows: readonly Row[] | RowsSource<Row>;
    /** Stable identity for a row — keys rendering, expansion, in-flight
     * delete tracking, and edit targeting. For editing it must return the
     * value the edit schema's id field carries: it is passed to
     * `editForm.for()` and seeded into the hidden id input. */
    rowKey: (row: Row) => EditRowKey;

    /** Pass your own controller to trigger the editors from anywhere;
     * without one the Table still offers its per-row Edit button. */
    controller?: TableController;

    /** Remote form driving the create editor — its presence puts the Add
     * trigger in the actions header. Used as-is (the create singleton, no
     * `.for()`). */
    createForm?: Omit<RemoteForm<CreateInput, CreateOutput>, "for">;
    /** Client-side validation schema for the create editor's Form. Output
     * deliberately unconstrained — transform schemas are
     * Kit-legal. */
    createSchema?: StandardSchemaV1<CreateInput, unknown>;

    /** Remote form driving the per-row edit editor — its presence adds the
     * default Edit button. Instantiated per row via `.for(rowKey(row))`. */
    editForm?: RemoteForm<EditInput, EditOutput>;
    /** Client-side validation schema for the edit editor's Form — same
     * output freedom as createSchema. */
    editSchema?: StandardSchemaV1<EditInput, unknown>;
    /** Field name in the edit schema that carries the row id — rendered
     * automatically as a hidden input in the editor row. Defaults to
     * "id". */
    idKey?: string;

    /** Width of the actions column as a CSS length. Optional — without it
     * the column shrinks to its content; pin offsets are measured from the
     * rendered header either way (this only serves SSR and width control). */
    actionsWidth?: string;

    /** Cell padding and type scale — "compact" for data-dense tables.
     * Defaults to the ambient density context. */
    density?: UiDensity;

    /** Column key the table scrolls to when it first mounts — the column
     * lands at the left edge of the scrolling region, after any pinned
     * columns — so a calendar spanning several years starts on the current
     * one, e.g. initialColumn={currentYear + "-01"}. Glides smoothly into
     * place (instant under prefers-reduced-motion) and is applied ONCE;
     * later remounts restore the user's own scroll position instead. For
     * jumps after mount, use `controller.scrollToColumn()`. */
    initialColumn?: string;

    /** Veils the whole table with a blurred overlay and a spinner, blocking
     * interaction with the (stale) rows beneath. A rows SOURCE veils
     * automatically; this prop exists for the awaited-array pattern — wire
     * it to the query's `.loading`, which flips true on every refresh,
     * the single-flight refreshes after editor submissions included. */
    loading?: boolean;

    /** Extra hidden inputs submitted with every editor save — for values
     * that come from OUTSIDE the columns, e.g. the parent row's id when
     * this table lives inside another table's expanded row. Each entry
     * renders an `<input type="hidden">` from the matching form field
     * (like the row id already does); entries whose key the current
     * form's schema lacks are skipped, so create and edit schemas may
     * declare different subsets. */
    hiddenFields?: { key: string; value: string | number }[];

    /** Styles the root element (the scroll wrapper). */
    class?: string;
    /** Extra classes for the <table> element. */
    tableClass?: string;
    /** Extra classes for every header cell. */
    headerCellClass?: string;
    /** Extra classes for every cell in the group header row. */
    groupHeaderCellClass?: string;
    /** Extra classes for every body cell. */
    cellClass?: string;
    /** Extra classes for display rows and the expanded-content rows beneath
     * them (editor rows use editorRowClass). */
    rowClass?: string;
    /** Extra classes for the create/edit editor rows. */
    editorRowClass?: string;
    /** Extra classes for the loading overlay. */
    loadingClass?: string;

    /** Attach to show the default Delete action on display rows — the same
     * presence rule as editForm/createForm. A Kit `command` fits naturally
     * (no form element needed; refresh the rows query in its handler for
     * single-flight updates). Handle errors inside — the table only tracks
     * the in-flight state per row. */
    ondelete?: (row: Row) => unknown;

    /** The <Column> definitions — columns self-register with the table via
     * context while this renders. */
    children: Snippet;
    /** Replaces the default actions cell on display rows. */
    actions?: Snippet<[{ row: Row; controller: TableController }]>;
    /** Enables row expansion: an expander column is prepended and this
     * renders full-width below an expanded row — any content goes. */
    expanded?: Snippet<[{ row: Row }]>;
    /** Replaces the default empty-state message in the filler row. */
    empty?: Snippet;
  };

  const {
    rows: rowsProp,
    rowKey,
    hiddenFields,

    controller = new TableController(),

    createForm,
    createSchema,

    editForm,
    editSchema,
    idKey = "id",

    actionsWidth,

    density,

    initialColumn,

    loading = false,

    class: classes,
    tableClass,
    headerCellClass,
    groupHeaderCellClass,
    cellClass,
    rowClass,
    editorRowClass,
    loadingClass,

    ondelete,

    children,
    actions,
    expanded,
    empty,
  }: Props = $props();

  // A rows source resolves to [] while its first load is in flight —
  // every consumer below (sorting, lookups, the empty state) reads this.
  const rows = $derived(
    Array.isArray(rowsProp)
      ? (rowsProp as readonly Row[])
      : ((rowsProp as RowsSource<Row>).current ?? []),
  );
  // The veil covers the explicit prop OR a source's own load state.
  const veiled = $derived(
    loading ||
      (!Array.isArray(rowsProp) && (rowsProp as RowsSource<Row>).loading),
  );

  const config = getUiConfig();

  // Ambient density for everything rendered inside the table — core controls
  // (inputs, selects) in editor snippets pick it up and size themselves to
  // match compact rows, with no forms↔tables coupling. The prop overrides;
  // otherwise the table inherits the ambient context it sits in.
  const ambientDensity = getUiDensity();
  const resolvedDensity = $derived(density ?? ambientDensity.density);
  setUiDensity({
    get density() {
      return resolvedDensity;
    },
  });

  const registrations = new SvelteMap<string, ColumnRegistration<never>>();

  // The nesting tree: read the ancestor BEFORE installing our own node.
  // Only one editor may be open per tree — every editing table wraps its
  // markup in a <form>, and nested form elements corrupt each other's
  // submits.
  const parentTree = getTableTree();
  const treeNode: TableTreeNode = {
    parent: parentTree,
    descendants: new Set(),
    editing: () => controller.editor.type !== "idle",
    closeEditor: () => controller.close(),
  };
  setTableTree(treeNode);
  if (parentTree) {
    parentTree.descendants.add(treeNode);
    onDestroy(() => parentTree.descendants.delete(treeNode));
  }

  function closeDescendantEditors(node: TableTreeNode) {
    for (const child of node.descendants) {
      child.closeEditor();
      closeDescendantEditors(child);
    }
  }

  setTableContext({
    register: (registration) => {
      registrations.set(registration.key, registration);
      return () => {
        registrations.delete(registration.key);
      };
    },
  });

  // Columns register during their init, i.e. while `{@render children()}`
  // runs — before the table markup below renders. That ordering holds on the
  // server too, which is what makes the table fully server-renderable. The
  // cast restores the row type the context erased.
  const columns = $derived([
    ...registrations.values(),
  ] as unknown as ColumnRegistration<Row>[]);

  const hasActionsColumn = $derived(
    editForm !== undefined ||
      createForm !== undefined ||
      ondelete !== undefined ||
      actions !== undefined,
  );

  // In-flight deletes, keyed per row — guards double clicks and disables the
  // row's button until the consumer's action settles.
  const deleting = new SvelteSet<string | number>();

  async function handleDelete(row: Row) {
    if (!ondelete) return;

    const key = rowKey(row);
    if (deleting.has(key)) return;

    deleting.add(key);
    try {
      await ondelete(row);
    } catch {
      // Error handling is the consumer's contract (inside their handler) —
      // but their rejection must not surface as an unhandled promise here.
    } finally {
      deleting.delete(key);
    }
  }

  // Pinned columns are reordered to their edge — a sticky column in the
  // middle of the table would let its unpinned neighbors scroll beneath it.
  const orderedColumns = $derived([
    ...columns.filter((column) => column.pin === "left"),
    ...columns.filter((column) => column.pin === undefined),
    ...columns.filter((column) => column.pin === "right"),
  ]);

  // SSR fallback for the expander column's width (the cell's w-10).
  const expanderWidth = "2.5rem";

  function sumWidths(parts: string[]): string {
    if (parts.length === 0) return "0px";
    if (parts.length === 1) return parts[0];
    return `calc(${parts.join(" + ")})`;
  }

  // Rendered widths measured off the header cells (bind:offsetWidth). Auto
  // table layout can distribute surplus width beyond declared widths — a
  // declared 2.5rem expander has measured 116px — so pin offsets must come
  // from real geometry. Declared widths only serve until hydration measures.
  const measuredWidths = $state<Record<string, number>>({});
  let measuredExpanderWidth = $state<number | undefined>();
  let measuredActionsWidth = $state<number | undefined>();

  function widthPart(column: ColumnRegistration<Row>): string {
    const measured = measuredWidths[column.key];
    return measured !== undefined ? `${measured}px` : (column.width ?? "0px");
  }

  // Sticky offsets accumulate from each edge — measured when possible,
  // declared widths as the fallback (which is why pinned columns must
  // declare one).
  const pinOffsets = $derived.by(() => {
    const offsets = new SvelteMap<
      string,
      { side: "left" | "right"; offset: string }
    >();

    const leftParts: string[] = expanded
      ? [
          measuredExpanderWidth !== undefined
            ? `${measuredExpanderWidth}px`
            : expanderWidth,
        ]
      : [];
    for (const column of orderedColumns) {
      if (column.pin !== "left") continue;
      offsets.set(column.key, { side: "left", offset: sumWidths(leftParts) });
      leftParts.push(widthPart(column));
    }

    const rightParts: string[] = hasActionsColumn
      ? [
          measuredActionsWidth !== undefined
            ? `${measuredActionsWidth}px`
            : (actionsWidth ?? "0px"),
        ]
      : [];
    for (const column of [...orderedColumns].reverse()) {
      if (column.pin !== "right") continue;
      offsets.set(column.key, { side: "right", offset: sumWidths(rightParts) });
      rightParts.push(widthPart(column));
    }

    return offsets;
  });

  // Column groups render as an extra header row of spanning cells. Spans
  // are consecutive runs over the ORDERED columns; pinned columns break out
  // into their own (label-less) cells because they must stay individually
  // sticky — a span can't be half-pinned.
  const hasGroups = $derived(
    orderedColumns.some((column) => column.group !== undefined),
  );

  const groupRuns = $derived.by(() => {
    const runs: {
      label: string | undefined;
      columns: ColumnRegistration<Row>[];
      pinned: boolean;
    }[] = [];

    for (const column of orderedColumns) {
      const pinned = pinOffsets.has(column.key);
      const label = pinned ? undefined : column.group;
      const last = runs.at(-1);

      if (last && !pinned && !last.pinned && last.label === label) {
        last.columns.push(column);
      } else {
        runs.push({ label, columns: [column], pinned });
      }
    }

    return runs;
  });

  // The column header row sticks BELOW the group row — measured, because
  // density changes the row height.
  let groupRowHeight = $state<number | undefined>();

  // Group separators are TRAILING (border-r on each run except the last):
  // a leading border would double up with the pinned column's boundary
  // border whenever a jump lands a run flush at the frozen edge, and the
  // last run's seam is drawn by the actions/right-pinned chrome instead.
  const lastUnpinnedRunIndex = $derived(
    groupRuns.findLastIndex((run) => !run.pinned),
  );

  // Where the scrolling region starts horizontally (after the expander and
  // left-pinned columns) — a group label sticks here so the group stays
  // identifiable while its span scrolls (the year over its months).
  const frozenLeftEdge = $derived.by(() => {
    const parts: string[] = expanded
      ? [
          measuredExpanderWidth !== undefined
            ? `${measuredExpanderWidth}px`
            : expanderWidth,
        ]
      : [];
    for (const column of orderedColumns) {
      if (column.pin === "left") parts.push(widthPart(column));
    }
    return sumWidths(parts);
  });

  function columnStyle(column: ColumnRegistration<Row>): string | undefined {
    const parts: string[] = [];

    if (column.width) {
      parts.push(
        `width: ${column.width}`,
        `min-width: ${column.width}`,
        `max-width: ${column.width}`,
      );
    }

    const pin = pinOffsets.get(column.key);
    if (pin) parts.push(`${pin.side}: ${pin.offset}`);

    return parts.length > 0 ? parts.join("; ") : undefined;
  }

  // Column borders mark two things: the expander/actions columns ALWAYS
  // carry a border towards the data (they are chrome, not data), and the
  // outermost pinned data columns additionally mark the pinned/scrolling
  // boundary.
  const lastLeftPinnedKey = $derived(
    orderedColumns.findLast((column) => column.pin === "left")?.key,
  );
  const firstRightPinnedKey = $derived(
    orderedColumns.find((column) => column.pin === "right")?.key,
  );

  function columnPinClasses(
    column: ColumnRegistration<Row>,
  ): string | undefined {
    if (!pinOffsets.has(column.key)) return undefined;

    return cn(
      "sticky z-10 bg-inherit",
      column.key === lastLeftPinnedKey && "border-r",
      column.key === firstRightPinnedKey && "border-l",
    );
  }

  // The scroll wrapper's clientWidth — by definition excluding borders and
  // any classic scrollbar — kept fresh by observing both the wrapper (outer
  // resizes) and the table (content growth toggles the vertical scrollbar,
  // which outer-box observers never see). 100cqw can't be trusted for this:
  // Chromium doesn't subtract scrollbars from container-query units.
  let scrollportWidth = $state<number>();
  let scrollportHeight = $state<number>();
  let tableWidth = $state<number>();

  // Editor swaps remount the whole markup (the Form wrapper is keyed) —
  // the scroll position is carried across remounts so opening or closing an
  // editor doesn't snap the table back to 0,0.
  let savedScrollLeft = 0;
  let savedScrollTop = 0;
  let scrollWrapper: HTMLElement | undefined;

  // Called by the controller synchronously before ANY editor transition —
  // the only moment the outgoing wrapper is reliably still connected
  // (attachment cleanup runs on an already-detached element, and scroll
  // events dispatch async).
  function captureScroll() {
    if (scrollWrapper?.isConnected) {
      savedScrollLeft = scrollWrapper.scrollLeft;
      savedScrollTop = scrollWrapper.scrollTop;
    }
  }

  function observeScrollport(wrapper: HTMLElement) {
    const table = wrapper.querySelector("table");
    scrollWrapper = wrapper;

    wrapper.scrollLeft = savedScrollLeft;
    wrapper.scrollTop = savedScrollTop;

    if (!initialScrollApplied) {
      initialScrollApplied = true;
      if (initialColumn !== undefined) {
        const key = initialColumn;
        // Smooth on purpose: the SSR paint cannot be pre-scrolled (HTML has
        // no scroll positions), so the anchor GLIDES into place instead of
        // jerking — and downgrades to instant under reduced motion.
        scrollToColumn(key, { behavior: "smooth" });
        initialAnchorApplied = true;
        initialAnchorOwns = true;

        // Real apps keep laying out after this attachment runs — web fonts
        // swap in, async-hydrated content lands — which both moves the
        // target column and grows the scroll range the first scroll was
        // clamped against. Re-anchor after paint and once fonts resolve,
        // ONLY while the initial anchor still owns the position: a later
        // controller jump clears ownership in scrollToColumn, and user
        // input on the scroller clears it below.
        const reanchor = () => {
          if (initialAnchorOwns && wrapper.isConnected) {
            scrollToColumn(key, { behavior: "smooth" });
            initialAnchorOwns = true;
          }
        };
        requestAnimationFrame(() => requestAnimationFrame(reanchor));
        document.fonts?.ready.then(reanchor);

        // A rows SOURCE lands its rows AFTER mount: the table widens when
        // they render, and the paint-time re-anchors above have long
        // fired against the header-only layout. Watch the veil lift and
        // re-anchor once the new layout has painted — same ownership
        // rules, so a user who scrolled meanwhile is never fought.
        // (Nested $effect: the attachment body runs inside an effect.)
        $effect(() => {
          if (!veiled) {
            requestAnimationFrame(() => requestAnimationFrame(reanchor));
          }
        });
      }
    }

    // User input on the scroller releases the initial anchor's ownership —
    // re-anchors must never fight a person. Scroll events can't serve here:
    // the anchor's own smooth animation fires them constantly. KNOWN GAP:
    // Firefox dispatches no pointer/wheel events for native-scrollbar drags
    // (Gecko bug 279330), so a drag inside the brief re-anchor window
    // (double-rAF + fonts.ready) is not released and the last re-anchor
    // wins once — accepted until it bites in practice.
    const releaseOwnership = () => {
      initialAnchorOwns = false;
    };
    const ownershipEvents = ["wheel", "touchstart", "pointerdown", "keydown"];
    for (const type of ownershipEvents) {
      wrapper.addEventListener(type, releaseOwnership, { passive: true });
    }
    // A scrollToColumn() fired before this scrollport existed (including
    // pre-mount calls) applies now — deliberately AFTER initialColumn, so
    // an explicit request wins over the declarative default.
    controller.flushScroll();

    const measure = () => {
      scrollportWidth = wrapper.clientWidth;
      scrollportHeight = wrapper.clientHeight;
      tableWidth = table?.offsetWidth;
    };

    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    if (table) observer.observe(table);
    measure();

    return () => {
      if (scrollWrapper === wrapper) scrollWrapper = undefined;
      for (const type of ownershipEvents) {
        wrapper.removeEventListener(type, releaseOwnership);
      }
      observer.disconnect();
    };
  }

  // Custom scrollbars only where classic (space-taking) WebKit scrollbars
  // render: overlay environments (macOS/iOS auto-hiding bars) and Firefox
  // (no ::-webkit-scrollbar; keeps the app's scrollbar-color) stay native.
  // Same trick as the form markers: the container hides overflow until the
  // mount-time probe has decided, so native scrollbars never flash — they
  // appear once, already styled.
  let settled = $state(false);
  let styledScrollbars = $state(false);

  onMount(() => {
    if (CSS.supports("selector(::-webkit-scrollbar)")) {
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:absolute;visibility:hidden;overflow:scroll;width:40px;height:40px";
      document.body.append(probe);
      styledScrollbars = probe.offsetWidth > probe.clientWidth;
      probe.remove();
    }

    settled = true;

    // A pre-attach trigger flipped the controller before this table could
    // prepare it — columns are registered by now, so honour it (or close if
    // it cannot be honoured).
    controller.resync();
  });

  // The edited row can vanish underneath the editor (deleted remotely, rows
  // refreshed) — close silently, consistent with drafts dropping on editor
  // switches.
  $effect(() => {
    const active = controller.editor;
    if (
      active.type === "edit" &&
      !rows.some((row) => rowKey(row) === active.rowId)
    ) {
      controller.close();
    }
  });

  // Track matches the header, the thumb is inset via a transparent border,
  // and the track carries a border towards the content — the "border against
  // the scrollbar". `[scrollbar-color:auto]!` re-enables ::-webkit-scrollbar
  // styling, which Chromium disables whenever a scrollbar-color is set
  // (the app sets one globally, hence the importance).
  const scrollbarClasses = tableTheme.scrollbar;

  // The remote form's typed fields proxy is indexed by runtime column keys,
  // which its compile-time shape cannot express — the single cast site.
  // Missing fields throw HERE with the column named: the raw undefined
  // would surface later as an opaque `.set is undefined` inside prepare.
  function fieldOf(fields: unknown, key: string): EditorField {
    const field = (fields as Record<string, EditorField | undefined>)[key];
    if (!field)
      throw new Error(
        `Table: the editor form has no field named "${key}" — every ` +
          "Column with an editor needs a matching field in the form schema",
      );
    return field;
  }

  function idFieldOf(fields: unknown): HiddenField {
    const field = (fields as Record<string, HiddenField | undefined>)[idKey];
    if (!field)
      throw new Error(
        `Table: the edit form has no "${idKey}" field — the edit schema ` +
          "must carry the row id (see the editing README)",
      );
    return field;
  }

  // The consumer's extra hidden inputs (hiddenFields): resolved against
  // the CURRENT session's form, skipping keys its schema lacks — create
  // and edit schemas may declare different subsets.
  function collectHiddenAttributes(fields: unknown): HiddenFieldAttributes[] {
    return (hiddenFields ?? []).flatMap(({ key, value }) => {
      const field = (fields as Record<string, HiddenField | undefined>)[key];
      return field ? [field.as("hidden", value)] : [];
    });
  }

  // Everything an open editor renders from. Written by prepare() BEFORE the
  // controller state flips and NEVER reset to undefined — only replaced by
  // the next session. This matters: the editor markup must not read values
  // that flip to undefined on close, because Svelte re-evaluates dependent
  // expressions during the same flush that tears the editor down — the
  // {#if} guards cannot protect them. A closed session simply goes stale
  // while nothing renders from it. ($state.raw: sessions are replaced
  // wholesale, and the remote form instance must not be proxied.)
  interface CreateSession {
    mode: "create";
    key: string;
    instance: Omit<RemoteForm<CreateInput, CreateOutput>, "for">;
    fields: Record<string, EditorField>;
    hiddenAttributes: HiddenFieldAttributes[];
  }

  interface EditSession {
    mode: "edit";
    key: string;
    instance: Omit<RemoteForm<EditInput, EditOutput>, "for">;
    fields: Record<string, EditorField>;
    rowId: EditRowKey;
    idAttributes: HiddenFieldAttributes;
    hiddenAttributes: HiddenFieldAttributes[];
  }

  let session = $state.raw<CreateSession | EditSession | undefined>(undefined);

  function sessionKeyFor(editor: TableEditor): string | undefined {
    if (editor.type === "create") return "create";
    if (editor.type === "edit") return `edit:${String(editor.rowId)}`;
    return undefined;
  }

  // The session outlives its editor, so rendering is gated on the controller
  // still pointing at it.
  const showEditor = $derived(
    session !== undefined && sessionKeyFor(controller.editor) === session.key,
  );

  function collectEditorFields(
    fields: unknown,
    seedOf: (column: ColumnRegistration<Row>) => unknown,
  ): Record<string, EditorField> {
    const collected: Record<string, EditorField> = {};

    for (const column of columns) {
      if (!column.editor) continue;

      const field = fieldOf(fields, column.key);
      (field.set as (value: unknown) => void)(seedOf(column));
      collected[column.key] = field;
    }

    return collected;
  }

  // Cached remote form instances (`.for(key)` per key, and the create
  // singleton) resurrect old drafts, so every trigger reseeds its editor's
  // fields before the editor state flips — at that point the target instance
  // has no mounted form element, so set() only writes the tracked value
  // without marking anything touched or dirty.
  function prepare(editor: TableEditor): boolean {
    // An editing ANCESTOR refuses descendant editors — its <form> wraps
    // this whole table, and a second form element inside it would corrupt
    // both submits. Finish or cancel the outer editor first. Opening here
    // closes any DESCENDANT editors for the same reason (mirroring how a
    // second editor in the SAME table closes the first).
    for (let node = treeNode.parent; node; node = node.parent) {
      if (node.editing()) {
        console.warn(
          "[privaty/ui-tables] Refused to open an editor: an ancestor " +
            "table is editing, and nested <form> elements corrupt both " +
            "submits. Save or cancel the outer editor first.",
        );
        return false;
      }
    }
    closeDescendantEditors(treeNode);

    if (editor.type === "create") {
      if (!createForm) return false;

      session = {
        mode: "create",
        key: "create",
        instance: createForm,
        fields: collectEditorFields(
          createForm.fields,
          (column) => column.createSeed,
        ),
        hiddenAttributes: collectHiddenAttributes(createForm.fields),
      };
      return true;
    }

    if (editor.type === "edit") {
      if (!editForm) return false;

      const row = rows.find((candidate) => rowKey(candidate) === editor.rowId);
      if (!row) return false;

      // The controller API is deliberately untied to the schema (RowKey =
      // string | number); the row lookup above already proved this key is one
      // the edit form can take.
      const rowId = editor.rowId as EditRowKey;
      const instance = editForm.for(rowId);

      const idField = idFieldOf(instance.fields);
      (idField.set as (value: unknown) => void)(rowId);

      session = {
        mode: "edit",
        key: `edit:${String(rowId)}`,
        instance,
        fields: collectEditorFields(instance.fields, (column) =>
          column.value(row),
        ),
        rowId,
        idAttributes: idField.as("hidden", rowId),
        hiddenAttributes: collectHiddenAttributes(instance.fields),
      };
      return true;
    }

    return true;
  }

  // A scrolled-to column must land just after the frozen edge (expander +
  // left-pinned columns), not under it. Everything is measured with
  // getBoundingClientRect and applied as a RELATIVE scroll: rects are the
  // on-screen truth in every browser, where offsetLeft/offsetParent
  // semantics around stuck sticky cells are not — and a stuck frozen
  // cell's right edge IS the visual frozen edge.
  function scrollToColumn(
    key: string,
    options?: { behavior?: ScrollBehavior },
  ): boolean {
    const wrapper = scrollWrapper;
    if (!wrapper) return false;

    const target = wrapper.querySelector<HTMLElement>(
      `thead th[data-column="${CSS.escape(key)}"]`,
    );
    if (!target) return true; // unknown column — nothing to honour

    const headerRow = target.parentElement as HTMLTableRowElement;
    const frozenCount =
      (expanded ? 1 : 0) +
      orderedColumns.filter((column) => column.pin === "left").length;
    const lastFrozen =
      frozenCount > 0 ? headerRow.cells[frozenCount - 1] : undefined;
    const frozenEdge = lastFrozen
      ? lastFrozen.getBoundingClientRect().right
      : wrapper.getBoundingClientRect().left + wrapper.clientLeft;

    // Any jump AFTER the initial anchor ends the initial anchor's
    // ownership — a late re-anchor (fonts resolving slowly) must never
    // yank a position a controller jump has since chosen.
    if (initialAnchorApplied) initialAnchorOwns = false;

    wrapper.scrollBy({
      left: target.getBoundingClientRect().left - frozenEdge,
      behavior: resolveScrollBehavior(options?.behavior),
    });
    return true;
  }

  // Programmatic smooth scrolling does NOT honour prefers-reduced-motion on
  // its own — every smooth request (consumer jumps included) downgrades to
  // instant for users who asked for less motion.
  function resolveScrollBehavior(behavior?: ScrollBehavior): ScrollBehavior {
    if (behavior !== "smooth") return behavior ?? "auto";
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
  }

  let initialAnchorApplied = false;
  let initialAnchorOwns = false;

  // initialColumn applies exactly once — editor swaps remount the markup,
  // and those attaches must restore the user's own position instead.
  let initialScrollApplied = false;

  // The controller is stable for the component's lifetime — capturing it for
  // attach/detach is intentional.
  // svelte-ignore state_referenced_locally
  const detach = controller.attach(prepare, captureScroll, scrollToColumn);
  onDestroy(detach);

  let sort = $state<{ key: string; direction: "asc" | "desc" } | undefined>(
    undefined,
  );

  function cycleSort(key: string) {
    if (sort?.key !== key) sort = { key, direction: "asc" };
    else if (sort.direction === "asc") sort = { key, direction: "desc" };
    else sort = undefined;
  }

  function defaultCompare(a: unknown, b: unknown): number {
    if (typeof a === "number" && typeof b === "number") return a - b;
    if (a instanceof Date && b instanceof Date)
      return a.getTime() - b.getTime();
    return String(a).localeCompare(String(b));
  }

  const sortedRows = $derived.by(() => {
    const active = sort;
    if (!active) return rows;

    const column = columns.find((candidate) => candidate.key === active.key);
    if (!column) return rows;

    const factor = active.direction === "asc" ? 1 : -1;

    return [...rows].toSorted((a, b) => {
      if (column.compare) return factor * column.compare(a, b);

      // Nullish values sort last in BOTH directions — outside the factor.
      const aValue = column.value(a);
      const bValue = column.value(b);
      const aNull = aValue == null;
      const bNull = bValue == null;
      if (aNull || bNull) return aNull && bNull ? 0 : aNull ? 1 : -1;

      return factor * defaultCompare(aValue, bValue);
    });
  });

  const columnCount = $derived(
    columns.length + (expanded ? 1 : 0) + (hasActionsColumn ? 1 : 0),
  );

  const expandedRows = new SvelteSet<string | number>();

  function toggleExpanded(key: string | number) {
    if (expandedRows.has(key)) expandedRows.delete(key);
    else expandedRows.add(key);
  }

  function displayText(column: ColumnRegistration<Row>, row: Row): string {
    const value = column.value(row);
    return value == null ? "" : String(value);
  }

  // The empty state yields to the create editor — "No rows" next to the
  // row being created would be a lie in progress — and to the veil: rows
  // that are merely still loading are not "no rows".
  const showEmpty = $derived(
    rows.length === 0 && !veiled && !(showEditor && session?.mode === "create"),
  );

  // Every data cell gets a tooltip: the column's accessor when given (so
  // custom formatting can carry through), the raw value as text otherwise.
  function cellTitle(column: ColumnRegistration<Row>, row: Row): string {
    return column.tooltip?.(row) ?? displayText(column, row);
  }

  const compact = $derived(resolvedDensity === "compact");

  // border-separate (not collapse): collapsed borders detach from sticky
  // cells. Cells only own their bottom border (rows) — the scroll wrapper
  // draws the full outer frame, keeping the scrollbars inside it. The
  // border-color utilities stay on every cell so boundary borders (border-r/
  // border-l on pinned edges) pick them up.
  // whitespace-nowrap: cell content never wraps — width-less columns size to
  // their content, width-constrained ones truncate. (Expanded content and
  // the empty state opt back into wrapping; whitespace is inherited.)
  const cellPadding = $derived(compact ? "px-2 py-0.5" : "px-3 py-1.5");
  // The stuck group label keeps the cell's horizontal padding as a gap to
  // the pinned edge — mirror cellPadding's px-* values.
  const groupLabelInset = $derived(compact ? "0.5rem" : "0.75rem");
  // Editor cells shed vertical padding so the input's own height (38px)
  // lands editor rows at display-row height instead of stretching them.
  const editorCellPadding = $derived(compact ? "py-0" : "py-0.5");
  const editorCellMinWidth = tableTheme.editorCellMinWidth;
  const iconButtonClasses = $derived(
    compact ? tableTheme.iconButton.compact : tableTheme.iconButton.comfortable,
  );
  const expanderButtonClasses = $derived(
    compact
      ? tableTheme.expanderButton.compact
      : tableTheme.expanderButton.comfortable,
  );

  const defaultHeaderCellClasses = $derived(
    cn(
      "sticky top-0 z-20 border-b whitespace-nowrap",
      tableTheme.border,
      tableTheme.headerBackground,
      cellPadding,
    ),
  );
  const defaultCellClasses = $derived(
    cn("border-b whitespace-nowrap", tableTheme.border, cellPadding),
  );
  // Explicit row backgrounds let pinned cells (bg-inherit) mask what scrolls
  // beneath them.
  const defaultRowClasses = tableTheme.rowBackground;
  // align-middle: editor and display cells share row heights now, so
  // non-editable content centers alongside the inputs.
  const defaultEditorRowClasses = cn(
    "align-middle",
    tableTheme.editorRowBackground,
  );
  const actionsCellClasses =
    "sticky right-0 z-10 w-px border-l bg-inherit whitespace-nowrap";

  const actionsStyle = $derived(
    actionsWidth
      ? `width: ${actionsWidth}; min-width: ${actionsWidth}; max-width: ${actionsWidth}`
      : undefined,
  );
</script>

{#snippet cellContent(column: ColumnRegistration<Row>, row: Row)}
  {#if column.width}
    <!-- Width-constrained cells clip overflowing content; the tooltip lives
         on the td. -->
    <span class="block truncate">
      {#if column.cell}
        {@render column.cell({ row, value: column.value(row) })}
      {:else}
        {displayText(column, row)}
      {/if}
    </span>
  {:else if column.cell}
    {@render column.cell({ row, value: column.value(row) })}
  {:else}
    {displayText(column, row)}
  {/if}
{/snippet}

{#snippet displayCells(row: Row)}
  {#each orderedColumns as column (column.key)}
    <td
      class={cn(defaultCellClasses, columnPinClasses(column), cellClass)}
      style={columnStyle(column)}
      title={cellTitle(column, row)}
    >
      {@render cellContent(column, row)}
    </td>
  {/each}
{/snippet}

{#snippet editorCells(
  fields: Record<string, EditorField>,
  row: Row | undefined,
)}
  {#each orderedColumns as column (column.key)}
    <td
      class={cn(
        defaultCellClasses,
        columnPinClasses(column),
        column.editor &&
          fields[column.key] &&
          cn(editorCellPadding, editorCellMinWidth),
        cellClass,
      )}
      style={columnStyle(column)}
      title={!(column.editor && fields[column.key]) && row !== undefined
        ? cellTitle(column, row)
        : undefined}
    >
      <!-- The fields guard covers columns registered after the session was
           prepared (dynamic columns): they stay blank until the next
           session. -->
      {#if column.editor && fields[column.key]}
        <!-- The boundary CONTAINS suspension: an editor snippet may await
             (remote select options, say) — without it the await suspends
             the whole freshly-created editor branch, and Svelte's async
             batching then re-evaluates that branch's expressions against
             the pre-open world (session still undefined: a crash). Editor
             rows never server-render, so the boundary's SSR caveat (the
             forms README) does not apply here. -->
        <svelte:boundary>
          {@render column.editor({ field: fields[column.key], row })}
          {#snippet pending()}
            <Spinner class="mx-auto size-4" />
          {/snippet}
        </svelte:boundary>
      {:else if row !== undefined}
        <!-- Non-editable columns keep their display rendering while the row
             is being edited. -->
        {@render cellContent(column, row)}
      {/if}
    </td>
  {/each}
{/snippet}

{#snippet editorActions(submitLabel: string)}
  <div class="flex gap-1">
    <Submit label={submitLabel} class={iconButtonClasses}>
      <CheckIcon class={tableTheme.icon} aria-hidden="true" />
    </Submit>
    <Reset class={iconButtonClasses}>
      <RotateCcwIcon class={tableTheme.icon} aria-hidden="true" />
    </Reset>
    <Button
      variant="secondary"
      type="button"
      class={iconButtonClasses}
      title={config.labels.table.cancel}
      onclick={() => controller.close()}
    >
      <XIcon class={tableTheme.icon} aria-hidden="true" />
      <span class="sr-only">{config.labels.table.cancel}</span>
    </Button>
  </div>
{/snippet}

{#snippet expanderCell(row: Row)}
  <!-- w-10 must match expanderWidth — and must WIN: zero cell padding keeps
       the min-content within 2.5rem, otherwise the rendered width exceeds
       the declared one and pinned neighbors snap left when sticky engages. -->
  <td
    class={cn(
      defaultCellClasses,
      "sticky left-0 z-10 w-10 max-w-10 min-w-10 border-r bg-inherit p-0 text-center align-middle",
      cellClass,
    )}
  >
    <button
      type="button"
      class={cn(
        "inline-flex cursor-pointer items-center justify-center align-middle",
        expanderButtonClasses,
      )}
      aria-expanded={expandedRows.has(rowKey(row))}
      title={config.labels.table.expand}
      onclick={() => toggleExpanded(rowKey(row))}
    >
      <ChevronRightIcon
        class={cn(
          "transition-transform",
          tableTheme.icon,
          expandedRows.has(rowKey(row)) && "rotate-90",
        )}
        aria-hidden="true"
      />
      <span class="sr-only">{config.labels.table.expand}</span>
    </button>
  </td>
{/snippet}

{#snippet expandedContent(row: Row)}
  {#if expanded && expandedRows.has(rowKey(row))}
    <tr class={cn(defaultRowClasses, rowClass)}>
      <td
        colspan={columnCount}
        class={cn(defaultCellClasses, "p-0 whitespace-normal", cellClass)}
      >
        <!-- Sticks to the visible scroll viewport instead of riding the
             table's horizontal scroll; overflows on its own when wider.
             The measured width wins over the 100cqw fallback: too wide by
             even a scrollbar's width and the sticky block gets dragged along
             for the final pixels of rightward scroll. -->
        <div
          class={cn(
            "sticky left-0 w-[100cqw] overflow-auto",
            styledScrollbars && scrollbarClasses,
          )}
          style={scrollportWidth !== undefined
            ? `width: ${scrollportWidth}px`
            : undefined}
        >
          {@render expanded({ row })}
        </div>
      </td>
    </tr>
  {/if}
{/snippet}

{#snippet tableMarkup(withForm: boolean)}
  <!-- @container: the 100cqw fallback for expanded-row content before the
       scrollport measurement lands. -->
  <!-- flex-col + the row background on the WRAPPER paint the fill region
       below sparse rows without any percentage heights inside the table —
       percentage table-row heights resolve differently across surrounding
       layouts (the phantom header-height overflow bug). -->
  <div
    {@attach observeScrollport}
    class={cn(
      // relative: the containing block for the loading veil's
      // pre-measurement absolute cover (below).
      "@container relative flex h-full flex-col",
      tableTheme.frame,
      settled ? "overflow-auto" : "overflow-hidden",
      styledScrollbars && scrollbarClasses,
      classes,
    )}
  >
    <!-- Sticky zero-size holder: an absolute overlay would scroll away
         with the content — sticky pins the veil to the VISIBLE scrollport
         (same mechanism as the empty state and expanded content). Sized
         from the measured scrollport; until the first measurement lands
         it is 0×0 and simply invisible. The holder and its role=status
         region stay MOUNTED while idle: live regions announce content
         CHANGES, and one inserted together with its text is often skipped
         by screen readers — only the veil and the text toggle. -->
    <div class="sticky top-0 left-0 z-40 h-0 w-0 shrink-0">
      <div role="status">
        {#if veiled}
          {#if scrollportWidth !== undefined && scrollportHeight !== undefined}
            <div
              class={cn(tableTheme.loadingOverlay, loadingClass)}
              style={`width: ${scrollportWidth}px; height: ${scrollportHeight}px`}
            >
              <Spinner class={tableTheme.loadingSpinner} />
            </div>
          {/if}
          <span class="sr-only">{config.labels.table.loading}</span>
        {/if}
      </div>
    </div>
    {#if veiled && scrollportWidth === undefined}
      <!-- Pre-measurement cover (SSR included): the px sizing above needs
           a client measurement, and an absolute veil INSIDE the sticky
           holder would resolve against the holder's 0×0 positioned box —
           so this visual twin lives directly under the relative wrapper
           and covers it edge to edge until the measurement lands (the
           fresh-load state is unscrolled, where wrapper = scrollport).
           Purely visual: the live region above owns the announcement. -->
      <div
        aria-hidden="true"
        class={cn(
          tableTheme.loadingOverlay,
          "absolute inset-0 z-40",
          loadingClass,
        )}
      >
        <Spinner class={tableTheme.loadingSpinner} />
      </div>
    {/if}
    <!-- inert while loading: the veil blocks pointer hits, inert blocks
         keyboard and assistive tech from the stale rows beneath. -->
    <table
      inert={veiled}
      class={cn(
        "min-w-full shrink-0 border-separate border-spacing-0 text-left",
        compact ? tableTheme.type.compact : tableTheme.type.comfortable,
        tableClass,
      )}
    >
      <thead>
        {#if hasGroups}
          <tr bind:offsetHeight={groupRowHeight}>
            {#if expanded}
              <th
                class={cn(
                  defaultHeaderCellClasses,
                  "left-0 z-30 w-10 max-w-10 min-w-10 border-r",
                  groupHeaderCellClass,
                )}
              ></th>
            {/if}
            {#each groupRuns as run, runIndex (runIndex)}
              {#if run.pinned}
                {@const column = run.columns[0]}
                <th
                  class={cn(
                    defaultHeaderCellClasses,
                    "z-30",
                    column.key === lastLeftPinnedKey && "border-r",
                    column.key === firstRightPinnedKey && "border-l",
                    groupHeaderCellClass,
                  )}
                  style={columnStyle(column)}
                ></th>
              {:else}
                <th
                  colspan={run.columns.length}
                  scope="colgroup"
                  class={cn(
                    defaultHeaderCellClasses,
                    runIndex !== lastUnpinnedRunIndex && "border-r",
                    groupHeaderCellClass,
                  )}
                >
                  {#if run.label !== undefined}
                    <!-- Sticky at the frozen edge: the label stays visible
                         while its span scrolls, so the group (the year) is
                         identifiable from any of its columns. -->
                    <!-- Block-level like the expanded-content sticky: an
                         inline-block does not engage sticky inside a table
                         cell in Chromium. -->
                    <div
                      class="sticky w-fit max-w-full truncate"
                      style="left: calc({frozenLeftEdge} + {groupLabelInset})"
                      title={run.label}
                    >
                      {run.label}
                    </div>
                  {/if}
                </th>
              {/if}
            {/each}
            {#if hasActionsColumn}
              <th
                class={cn(
                  defaultHeaderCellClasses,
                  "right-0 z-30 w-px border-l whitespace-nowrap",
                  groupHeaderCellClass,
                )}
                style={actionsStyle}
              ></th>
            {/if}
          </tr>
        {/if}
        <tr>
          {#if expanded}
            <th
              bind:offsetWidth={measuredExpanderWidth}
              style:top={hasGroups ? `${groupRowHeight ?? 0}px` : undefined}
              class={cn(
                defaultHeaderCellClasses,
                "left-0 z-30 w-10 max-w-10 min-w-10 border-r",
                headerCellClass,
              )}
            >
              <span class="sr-only">{config.labels.table.expand}</span>
            </th>
          {/if}
          {#each orderedColumns as column (column.key)}
            <th
              bind:offsetWidth={measuredWidths[column.key]}
              data-column={column.key}
              style:top={hasGroups ? `${groupRowHeight ?? 0}px` : undefined}
              class={cn(
                defaultHeaderCellClasses,
                pinOffsets.has(column.key) && "z-30",
                column.key === lastLeftPinnedKey && "border-r",
                column.key === firstRightPinnedKey && "border-l",
                headerCellClass,
              )}
              style={columnStyle(column)}
              title={column.label}
              aria-sort={sort?.key === column.key
                ? sort.direction === "asc"
                  ? "ascending"
                  : "descending"
                : undefined}
            >
              {#if column.sortable}
                <button
                  type="button"
                  class="flex w-full cursor-pointer items-center gap-1 overflow-hidden"
                  onclick={() => cycleSort(column.key)}
                >
                  <span class="truncate">{column.label}</span>
                  {#if sort?.key === column.key}
                    <span aria-hidden="true">
                      {sort.direction === "asc" ? "↑" : "↓"}
                    </span>
                  {/if}
                </button>
              {:else}
                <span class="block truncate">{column.label}</span>
              {/if}
            </th>
          {/each}
          {#if hasActionsColumn}
            <th
              bind:offsetWidth={measuredActionsWidth}
              style:top={hasGroups ? `${groupRowHeight ?? 0}px` : undefined}
              class={cn(
                defaultHeaderCellClasses,
                "right-0 z-30 w-px border-l whitespace-nowrap",
                headerCellClass,
              )}
              style={actionsStyle}
            >
              {#if createForm}
                <!-- The header hosts the Add trigger; the column keeps its
                   accessible name via the sr-only label. -->
                <span class="sr-only">{config.labels.table.actions}</span>
                <Button
                  type="button"
                  class={iconButtonClasses}
                  title={config.labels.table.add}
                  disabled={showEditor && session?.mode === "create"}
                  onclick={() => controller.startCreate()}
                >
                  <PlusIcon class={tableTheme.icon} aria-hidden="true" />
                  <span class="sr-only">{config.labels.table.add}</span>
                </Button>
              {:else}
                {config.labels.table.actions}
              {/if}
            </th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#if showEditor && session?.mode === "create"}
          <tr class={cn(defaultEditorRowClasses, editorRowClass)}>
            {#if expanded}
              <td
                class={cn(
                  defaultCellClasses,
                  "sticky left-0 z-10 w-10 max-w-10 min-w-10 border-r bg-inherit p-0",
                  cellClass,
                )}
              ></td>
            {/if}
            {@render editorCells(session?.fields ?? {}, undefined)}
            <td
              class={cn(defaultCellClasses, actionsCellClasses, cellClass)}
              style={actionsStyle}
            >
              {#each session?.hiddenAttributes ?? [] as attributes, index (index)}
                <input {...attributes} />
              {/each}
              {@render editorActions(config.labels.table.add)}
            </td>
          </tr>
        {/if}

        {#each sortedRows as row (rowKey(row))}
          {#if showEditor && session?.mode === "edit" && rowKey(row) === session.rowId}
            <tr class={cn(defaultEditorRowClasses, editorRowClass)}>
              {#if expanded}
                {@render expanderCell(row)}
              {/if}
              {@render editorCells(session?.fields ?? {}, row)}
              <td
                class={cn(defaultCellClasses, actionsCellClasses, cellClass)}
                style={actionsStyle}
              >
                <!-- The row id rides along as a hidden input in the actions
                   cell — it needs no column. -->
                <input
                  {...session?.mode === "edit" ? session.idAttributes : {}}
                />
                {#each session?.hiddenAttributes ?? [] as attributes, index (index)}
                  <input {...attributes} />
                {/each}
                {@render editorActions(config.labels.table.save)}
              </td>
            </tr>
          {:else}
            <tr class={cn(defaultRowClasses, rowClass)}>
              {#if expanded}
                {@render expanderCell(row)}
              {/if}
              {@render displayCells(row)}
              {#if hasActionsColumn}
                <td
                  class={cn(defaultCellClasses, actionsCellClasses, cellClass)}
                  style={actionsStyle}
                >
                  {#if actions}
                    {@render actions({ row, controller })}
                  {:else}
                    <div class="flex gap-1">
                      {#if editForm}
                        <Button
                          variant="secondary"
                          type="button"
                          class={iconButtonClasses}
                          title={config.labels.table.edit}
                          onclick={() => controller.startEdit(rowKey(row))}
                        >
                          <PencilIcon
                            class={tableTheme.icon}
                            aria-hidden="true"
                          />
                          <span class="sr-only">
                            {config.labels.table.edit}
                          </span>
                        </Button>
                      {/if}
                      {#if ondelete}
                        <Button
                          variant="secondary"
                          type="button"
                          class={iconButtonClasses}
                          title={config.labels.table.delete}
                          disabled={deleting.has(rowKey(row))}
                          onclick={() => void handleDelete(row)}
                        >
                          <Trash2Icon
                            class={tableTheme.icon}
                            aria-hidden="true"
                          />
                          <span class="sr-only">
                            {config.labels.table.delete}
                          </span>
                        </Button>
                      {/if}
                    </div>
                  {/if}
                </td>
              {/if}
            </tr>
          {/if}
          {@render expandedContent(row)}
        {/each}
      </tbody>
    </table>

    <!-- Grows into the leftover container height; the wrapper's background
         paints it. Sized to the TABLE's width: sticky children cannot leave
         their parent, so a merely scrollport-wide filler would drag the
         empty state along the x scroll. The inner layer then sticks to the
         VISIBLE viewport (same mechanism as expanded content). -->
    <div
      class="min-w-full grow"
      style={tableWidth !== undefined ? `width: ${tableWidth}px` : undefined}
    >
      {#if showEmpty}
        <div
          class="sticky left-0 flex h-full w-[100cqw] items-center justify-center py-6"
          style={scrollportWidth !== undefined
            ? `width: ${scrollportWidth}px`
            : undefined}
        >
          {#if empty}
            {@render empty()}
          {:else}
            <span class={tableTheme.emptyText}>{config.labels.table.empty}</span
            >
          {/if}
        </div>
      {/if}
    </div>
  </div>

  {#if withForm}
    <FormError />
  {/if}
{/snippet}

{@render children()}

{#if showEditor && session?.mode === "edit"}
  {#key session.key}
    <!-- Capture the session so a save resolving AFTER the user switched
         editors doesn't close the editor that is open now. -->
    {@const succeededKey = session.key}
    <Form
      form={session.instance}
      schema={editSchema}
      class="block h-full"
      onsuccess={() => {
        if (sessionKeyFor(controller.editor) === succeededKey) {
          controller.close();
        }
      }}
    >
      {@render tableMarkup(true)}
    </Form>
  {/key}
{:else if showEditor && session?.mode === "create"}
  {@const succeededKey = session.key}
  <Form
    form={session.instance}
    schema={createSchema}
    class="block h-full"
    onsuccess={() => {
      if (sessionKeyFor(controller.editor) === succeededKey) {
        controller.close();
      }
    }}
  >
    {@render tableMarkup(true)}
  </Form>
{:else}
  {@render tableMarkup(false)}
{/if}
