<script
  lang="ts"
  generics="Row, CreateInput extends RemoteFormInput = RemoteFormInput, CreateOutput = unknown, EditInput extends RemoteFormInput = RemoteFormInput, EditOutput = unknown"
>
  import { cn } from "#privaty/ui/cn.js";
  import Button from "#privaty/ui/components/button.svelte";
  import { getUiConfig } from "#privaty/ui/config/context.js";
  import {
    getUiDensity,
    setUiDensity,
    type UiDensity,
  } from "#privaty/ui/config/density.js";
  import {
    CheckIcon,
    ChevronRightIcon,
    PencilIcon,
    PlusIcon,
    RotateCcwIcon,
    Trash2Icon,
    XIcon,
  } from "@lucide/svelte";
  import FormError from "#privaty/ui-forms/components/form-error.svelte";
  import Reset from "#privaty/ui-forms/components/reset.svelte";
  import Submit from "#privaty/ui-forms/components/submit.svelte";
  import Form from "#privaty/ui-forms/form.svelte";
  import type { RemoteForm, RemoteFormInput } from "$app/server";
  import type { StandardSchemaV1 } from "@standard-schema/spec";
  import { onDestroy, onMount, type Snippet } from "svelte";
  import { SvelteMap, SvelteSet } from "svelte/reactivity";
  import { setTableContext } from "./context";
  import { TableController } from "./table-controller.svelte";
  import type {
    ColumnRegistration,
    EditorField,
    HiddenField,
    HiddenFieldAttributes,
    TableEditor,
  } from "./types";

  // The exact key type `.for()` accepts — Kit derives it from the edit
  // schema's `id` field (falling back to string | number without one).
  type EditRowKey = Parameters<RemoteForm<EditInput, EditOutput>["for"]>[0];

  type Props = {
    rows: readonly Row[];
    rowKey: (row: Row) => EditRowKey;

    /** Pass your own controller to trigger the editors from anywhere;
     * without one the Table still offers its per-row Edit button. */
    controller?: TableController;

    createForm?: Omit<RemoteForm<CreateInput, CreateOutput>, "for">;
    /** Output deliberately unconstrained — transform schemas are
     * Kit-legal. */
    createSchema?: StandardSchemaV1<CreateInput, unknown>;

    editForm?: RemoteForm<EditInput, EditOutput>;
    editSchema?: StandardSchemaV1<EditInput, unknown>;
    /** Field name in the edit schema that carries the row id. */
    idKey?: string;

    /** Width of the actions column as a CSS length. Optional — without it
     * the column shrinks to its content; pin offsets are measured from the
     * rendered header either way (this only serves SSR and width control). */
    actionsWidth?: string;

    /** Cell padding and type scale — "compact" for data-dense tables.
     * Defaults to the ambient density context. */
    density?: UiDensity;

    /** Styles the root element (the scroll wrapper). */
    class?: string;
    tableClass?: string;
    headerCellClass?: string;
    cellClass?: string;
    rowClass?: string;
    editorRowClass?: string;

    /** Attach to show the default Delete action on display rows — the same
     * presence rule as editForm/createForm. A Kit `command` fits naturally
     * (no form element needed; refresh the rows query in its handler for
     * single-flight updates). Handle errors inside — the table only tracks
     * the in-flight state per row. */
    ondelete?: (row: Row) => unknown;

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
    rows,
    rowKey,

    controller = new TableController(),

    createForm,
    createSchema,

    editForm,
    editSchema,
    idKey = "id",

    actionsWidth,

    density,

    class: classes,
    tableClass,
    headerCellClass,
    cellClass,
    rowClass,
    editorRowClass,

    ondelete,

    children,
    actions,
    expanded,
    empty,
  }: Props = $props();

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

    const measure = () => {
      scrollportWidth = wrapper.clientWidth;
    };

    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    if (table) observer.observe(table);
    measure();

    return () => {
      if (scrollWrapper === wrapper) scrollWrapper = undefined;
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
  const scrollbarClasses = cn(
    "[scrollbar-color:auto]!",
    "[&::-webkit-scrollbar]:size-2.5",
    "[&::-webkit-scrollbar-track]:bg-stone-100 dark:[&::-webkit-scrollbar-track]:bg-stone-900",
    "[&::-webkit-scrollbar-track]:border-stone-300 dark:[&::-webkit-scrollbar-track]:border-stone-700",
    "[&::-webkit-scrollbar-track:vertical]:border-l",
    "[&::-webkit-scrollbar-track:horizontal]:border-t",
    "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding",
    "[&::-webkit-scrollbar-thumb]:bg-stone-400 dark:[&::-webkit-scrollbar-thumb]:bg-stone-600",
    "[&::-webkit-scrollbar-thumb:hover]:bg-stone-500 dark:[&::-webkit-scrollbar-thumb:hover]:bg-stone-500",
    "[&::-webkit-scrollbar-corner]:bg-stone-100 dark:[&::-webkit-scrollbar-corner]:bg-stone-900",
  );

  // The remote form's typed fields proxy is indexed by runtime column keys,
  // which its compile-time shape cannot express — the single cast site.
  function fieldOf(fields: unknown, key: string): EditorField {
    return (fields as Record<string, EditorField>)[key];
  }

  function idFieldOf(fields: unknown): HiddenField {
    return (fields as Record<string, HiddenField>)[idKey];
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
  }

  interface EditSession {
    mode: "edit";
    key: string;
    instance: Omit<RemoteForm<EditInput, EditOutput>, "for">;
    fields: Record<string, EditorField>;
    rowId: EditRowKey;
    idAttributes: HiddenFieldAttributes;
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
      };
      return true;
    }

    return true;
  }

  // The controller is stable for the component's lifetime — capturing it for
  // attach/detach is intentional.
  // svelte-ignore state_referenced_locally
  const detach = controller.attach(prepare, captureScroll);
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

  // The empty state yields to the create editor — "No rows" next to the row
  // being created would be a lie in progress.
  const showEmpty = $derived(
    rows.length === 0 && !(showEditor && session?.mode === "create"),
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
  // Editor cells shed vertical padding so the input's own height (38px)
  // lands editor rows at display-row height instead of stretching them.
  const editorCellPadding = $derived(compact ? "py-0" : "py-0.5");
  // Width-less columns auto-size to their display content, which can leave
  // an input a few digits of room — editing needs usable space. Declared-
  // width columns are unaffected (their inline style wins).
  const editorCellMinWidth = "min-w-32";
  const iconButtonClasses = $derived(compact ? "p-1" : "p-1.5");
  const expanderButtonClasses = $derived(compact ? "p-1" : "p-2");

  const defaultHeaderCellClasses = $derived(
    cn(
      "sticky top-0 z-20 border-b border-stone-300 bg-stone-100 whitespace-nowrap dark:border-stone-700 dark:bg-stone-900",
      cellPadding,
    ),
  );
  const defaultCellClasses = $derived(
    cn(
      "border-b border-stone-300 whitespace-nowrap dark:border-stone-700",
      cellPadding,
    ),
  );
  // Explicit row backgrounds let pinned cells (bg-inherit) mask what scrolls
  // beneath them.
  const defaultRowClasses = "bg-white dark:bg-stone-950";
  // align-middle: editor and display cells share row heights now, so
  // non-editable content centers alongside the inputs.
  const defaultEditorRowClasses = "bg-stone-100 align-middle dark:bg-stone-900";
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
        {@render column.editor({ field: fields[column.key], row })}
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
      <CheckIcon class="size-4" aria-hidden="true" />
    </Submit>
    <Reset class={iconButtonClasses}>
      <RotateCcwIcon class="size-4" aria-hidden="true" />
    </Reset>
    <Button
      variant="secondary"
      type="button"
      class={iconButtonClasses}
      title={config.labels.table.cancel}
      onclick={() => controller.close()}
    >
      <XIcon class="size-4" aria-hidden="true" />
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
          "size-4 transition-transform",
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
  <div
    {@attach observeScrollport}
    class={cn(
      "@container h-full border border-stone-300 dark:border-stone-700",
      settled ? "overflow-auto" : "overflow-hidden",
      styledScrollbars && scrollbarClasses,
      classes,
    )}
  >
    <table
      class={cn(
        "h-full min-w-full border-separate border-spacing-0 text-left",
        compact && "text-sm",
        tableClass,
      )}
    >
      <thead>
        <tr>
          {#if expanded}
            <th
              bind:offsetWidth={measuredExpanderWidth}
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
                  <PlusIcon class="size-4" aria-hidden="true" />
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
            {@render editorCells(session.fields, undefined)}
            <td
              class={cn(defaultCellClasses, actionsCellClasses, cellClass)}
              style={actionsStyle}
            >
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
              {@render editorCells(session.fields, row)}
              <td
                class={cn(defaultCellClasses, actionsCellClasses, cellClass)}
                style={actionsStyle}
              >
                <!-- The row id rides along as a hidden input in the actions
                   cell — it needs no column. -->
                <input {...session.idAttributes} />
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
                          <PencilIcon class="size-4" aria-hidden="true" />
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
                          <Trash2Icon class="size-4" aria-hidden="true" />
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

        <!-- Filler row: absorbs leftover container height (the table is
           h-full), so a sparse table still paints a full table region — and
           hosts the empty state when there are no rows. Zero padding keeps
           it invisible in auto-height containers. -->
        <tr class={cn("h-full", defaultRowClasses, rowClass)}>
          <td
            colspan={columnCount}
            class={cn(
              defaultCellClasses,
              "border-b-0 p-0 align-middle whitespace-normal",
              cellClass,
            )}
          >
            {#if showEmpty}
              <!-- Centered in the VISIBLE scroll viewport, not the scroll
                   area — same sticky + measured-width mechanism as expanded
                   content, so it holds the middle at any scroll position. -->
              <div
                class="sticky left-0 flex w-[100cqw] justify-center py-6"
                style={scrollportWidth !== undefined
                  ? `width: ${scrollportWidth}px`
                  : undefined}
              >
                {#if empty}
                  {@render empty()}
                {:else}
                  <span class="text-stone-500">
                    {config.labels.table.empty}
                  </span>
                {/if}
              </div>
            {/if}
          </td>
        </tr>
      </tbody>
    </table>
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
