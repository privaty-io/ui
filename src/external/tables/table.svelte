<script
  lang="ts"
  generics="Row, CreateInput extends RemoteFormInput = RemoteFormInput, CreateOutput = unknown, EditInput extends RemoteFormInput = RemoteFormInput, EditOutput = unknown"
>
  import { cn } from "#privaty/ui/cn.js";
  import Button from "#privaty/ui/components/button.svelte";
  import { getUiConfig } from "#privaty/ui/config/context.js";
  import FormError from "#privaty/ui-forms/components/form-error.svelte";
  import Reset from "#privaty/ui-forms/components/reset.svelte";
  import Submit from "#privaty/ui-forms/components/submit.svelte";
  import Form from "#privaty/ui-forms/form.svelte";
  import type { RemoteForm, RemoteFormInput } from "$app/server";
  import type { StandardSchemaV1 } from "@standard-schema/spec";
  import { onDestroy, type Snippet } from "svelte";
  import { SvelteMap } from "svelte/reactivity";
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
    createSchema?: StandardSchemaV1<CreateInput>;

    editForm?: RemoteForm<EditInput, EditOutput>;
    editSchema?: StandardSchemaV1<EditInput>;
    /** Field name in the edit schema that carries the row id. */
    idKey?: string;

    class?: string;
    headerCellClass?: string;
    cellClass?: string;
    editorRowClass?: string;

    children: Snippet;
    /** Replaces the default actions cell on display rows. */
    actions?: Snippet<[{ row: Row; controller: TableController }]>;
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

    class: classes,
    headerCellClass,
    cellClass,
    editorRowClass,

    children,
    actions,
  }: Props = $props();

  const config = getUiConfig();

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
  const detach = controller.attach(prepare);
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
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  }

  const sortedRows = $derived.by(() => {
    const active = sort;
    if (!active) return rows;

    const column = columns.find((candidate) => candidate.key === active.key);
    if (!column) return rows;

    const compare =
      column.compare ??
      ((a: Row, b: Row) => defaultCompare(column.value(a), column.value(b)));
    const factor = active.direction === "asc" ? 1 : -1;

    return [...rows].toSorted((a, b) => factor * compare(a, b));
  });

  const hasActionsColumn = $derived(
    editForm !== undefined || createForm !== undefined || actions !== undefined,
  );

  function displayText(column: ColumnRegistration<Row>, row: Row): string {
    const value = column.value(row);
    return value == null ? "" : String(value);
  }

  const defaultHeaderCellClasses =
    "border border-stone-300 px-3 py-1.5 dark:border-stone-700";
  const defaultCellClasses =
    "border border-stone-300 px-3 py-1.5 dark:border-stone-700";
  const defaultEditorRowClasses = "bg-stone-100 align-top dark:bg-stone-900";
</script>

{#snippet cellContent(column: ColumnRegistration<Row>, row: Row)}
  {#if column.cell}
    {@render column.cell({ row, value: column.value(row) })}
  {:else}
    {displayText(column, row)}
  {/if}
{/snippet}

{#snippet displayCells(row: Row)}
  {#each columns as column (column.key)}
    <td class={cn(defaultCellClasses, cellClass)}>
      {@render cellContent(column, row)}
    </td>
  {/each}
{/snippet}

{#snippet editorCells(
  fields: Record<string, EditorField>,
  row: Row | undefined,
)}
  {#each columns as column (column.key)}
    <td class={cn(defaultCellClasses, cellClass)}>
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
    <Submit label={submitLabel} />
    <Reset />
    <Button
      variant="secondary"
      type="button"
      onclick={() => controller.close()}
    >
      {config.labels.table.cancel}
    </Button>
  </div>
{/snippet}

{#snippet tableMarkup(withForm: boolean)}
  <table class={cn("w-full border-collapse text-left", classes)}>
    <thead>
      <tr>
        {#each columns as column (column.key)}
          <th
            class={cn(defaultHeaderCellClasses, headerCellClass)}
            aria-sort={sort?.key === column.key
              ? sort.direction === "asc"
                ? "ascending"
                : "descending"
              : undefined}
          >
            {#if column.sortable}
              <button
                type="button"
                class="flex w-full cursor-pointer items-center gap-1"
                onclick={() => cycleSort(column.key)}
              >
                {column.label}
                {#if sort?.key === column.key}
                  <span aria-hidden="true">
                    {sort.direction === "asc" ? "↑" : "↓"}
                  </span>
                {/if}
              </button>
            {:else}
              {column.label}
            {/if}
          </th>
        {/each}
        {#if hasActionsColumn}
          <th class={cn(defaultHeaderCellClasses, headerCellClass)}>
            {config.labels.table.actions}
          </th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#if showEditor && session?.mode === "create"}
        <tr class={cn(defaultEditorRowClasses, editorRowClass)}>
          {@render editorCells(session.fields, undefined)}
          <td class={cn(defaultCellClasses, cellClass)}>
            {@render editorActions(config.labels.table.add)}
          </td>
        </tr>
      {/if}

      {#each sortedRows as row (rowKey(row))}
        {#if showEditor && session?.mode === "edit" && rowKey(row) === session.rowId}
          <tr class={cn(defaultEditorRowClasses, editorRowClass)}>
            {@render editorCells(session.fields, row)}
            <td class={cn(defaultCellClasses, cellClass)}>
              <!-- The row id rides along as a hidden input in the actions
                   cell — it needs no column. -->
              <input {...session.idAttributes} />
              {@render editorActions(config.labels.table.save)}
            </td>
          </tr>
        {:else}
          <tr>
            {@render displayCells(row)}
            {#if hasActionsColumn}
              <td class={cn(defaultCellClasses, cellClass)}>
                {#if actions}
                  {@render actions({ row, controller })}
                {:else if editForm}
                  <Button
                    variant="secondary"
                    type="button"
                    class="text-sm"
                    onclick={() => controller.startEdit(rowKey(row))}
                  >
                    {config.labels.table.edit}
                  </Button>
                {/if}
              </td>
            {/if}
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>

  {#if withForm}
    <FormError />
  {/if}
{/snippet}

{@render children()}

{#if showEditor && session?.mode === "edit"}
  {#key session.key}
    <Form
      form={session.instance}
      schema={editSchema}
      class="block"
      onsuccess={() => controller.close()}
    >
      {@render tableMarkup(true)}
    </Form>
  {/key}
{:else if showEditor && session?.mode === "create"}
  <Form
    form={session.instance}
    schema={createSchema}
    class="block"
    onsuccess={() => controller.close()}
  >
    {@render tableMarkup(true)}
  </Form>
{:else}
  {@render tableMarkup(false)}
{/if}
