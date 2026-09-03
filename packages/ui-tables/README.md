# @privaty/ui-tables

A declarative data table for SvelteKit remote functions: self-registering
`<Column>` children, tri-state client-side sorting, sticky headers, pinned
columns, row expansion, an empty/fill state — and inline CRUD editing built
on `@privaty/ui-forms`.

```bash
pnpm add @privaty/ui @privaty/ui-forms @privaty/ui-tables
```

> Requires `@privaty/ui` AND `@privaty/ui-forms` as **peerDependencies** at
> the same lockstep version (single instances — Symbol-keyed contexts), plus
> the Kit/Tailwind setup from their READMEs.

Every export is also available from the package root — `import { Table,
Column } from "@privaty/ui-tables"` — alongside the deep subpaths shown
below; both tree-shake.

## Quickstart

```svelte
<script>
  import Table from "@privaty/ui-tables/table.svelte";
  import Column from "@privaty/ui-tables/column.svelte";
  import { TableController } from "@privaty/ui-tables/table-controller.svelte.js";
  import TextInput from "@privaty/ui-forms/inputs/text-input.svelte";
  import { createRow, deleteRow, getRows, updateRow } from "./data.remote";

  const controller = new TableController();
  const rows = $derived(await getRows()); // await BARE — see forms README
</script>

<div class="h-96">
  <Table
    {rows}
    rowKey={(row) => row.id}
    {controller}
    createForm={createRow}
    createSchema={createRowSchema}
    editForm={updateRow}
    editSchema={updateRowSchema}
    ondelete={(row) => deleteRow(row.id)}
  >
    <Column key="name" label="Name" value={(row: Item) => row.name} sortable>
      {#snippet editor({ field, row })}
        <TextInput {field} label="Name" labelStyle="hidden" initialValue={row?.name ?? ""} required />
      {/snippet}
    </Column>
  </Table>
</div>
```

## Data loading

`rows` accepts a plain array or a **rows source** — the structural
`{ current, loading }` slice of a SvelteKit remote query, so the query
object itself satisfies it. Two recipes, one per rendering goal:

```svelte
<script>
  // 1. Fully server-rendered rows: await BARE (`.current` never
  //    server-renders); keep the query handle so refreshes show the veil.
  const rowsQuery = getRows();
  const rows = $derived(await rowsQuery);
</script>

<Table {rows} loading={rowsQuery.loading} ... />

<!-- 2. SSR the LOADING state, fill on the client: pass the query itself.
     `current` is always undefined on the server, so the page ships the
     veiled table and the client loads the rows in — hydration-safe,
     because server and client agree the table is loading. -->
<Table rows={getRows()} ... />
```

A source veils the table automatically (and suppresses the empty state —
rows that are merely still loading are not "no rows"); the `loading` prop
remains for the awaited-array pattern's refreshes. `RowOf<typeof
rowsQuery>` extracts the row type once per page for column `value`
annotations — no re-deriving the query's awaited type per column. Do NOT build loading
UI by wrapping the Table in `{#if}`/`{#await}`/a pending boundary: a
`<svelte:boundary>` `pending` snippet server-renders INSTEAD of the table
(see the forms README), and unmounting the table during loads is exactly
what makes its own veil unreachable.

### Editor options from another query

An editor select often needs remote options (categories, employees).
Awaiting that query in the component script trips Svelte's
`await_waterfall` warning: the async derived resolves at mount but is
first READ when an editor opens. Hold the un-awaited handle instead and
read it where it is used:

```svelte
<script>
  // No await — just the handle. The fetch starts on the first read.
  const categoriesQuery = getCategories();
</script>

{#snippet editor({ field, row })}
  <SelectInput
    {field}
    label="Category"
    labelStyle="hidden"
    options={toSelectOptions(categoriesQuery.current, {
      value: (category) => category.id,
      label: (category) => category.name,
    })}
    initialValue={row?.category ?? ""}
  />
{/snippet}
```

(`toSelectOptions` is @privaty/ui's array-to-options glue — it tolerates
the query's undefined pre-fetch `current` and yields `[]`.)

`.current` is reactive: the options render empty the instant the first
editor opens and fill in when the fetch lands — no waterfall, no warning,
and tables that are never edited never fetch the options. To pre-warm the
options at mount instead, read `categoriesQuery.current` once in an
`$effect`.

## The editing architecture

One editor at a time (create row OR one edit row); the whole `<table>` wraps
in a single `<Form>` swapped per active editor. The `TableController` is the
imperative surface — `startCreate()`, `startEdit(rowId)`, `close()` — usable
from anywhere (toolbar, another page's navigation handler). Actions appear by
**presence**: Edit with `editForm`, the header Add button with `createForm`,
Delete with `ondelete`. Deletes fit Kit `command`s (no form element — a
per-row form cannot nest inside the wrapping edit form; refresh the rows
query in the handler for single-flight updates).

Drafts drop silently on editor switches and when the edited row disappears
from `rows`. Editors reseed on entry (cached remote-form instances would
resurrect old drafts otherwise). The edit schema needs a row-id field
(`idKey`, default `"id"`), rendered as a hidden input automatically.

- One `TableController` drives one `<Table>`; construct controllers per
  component/request — NOT at module scope (concurrent async SSR would share
  them).
- `Column` `key` must match the field name in both schemas; `value(row)`
  serves display, default sorting, and edit seeding. Editor snippets pass
  their own `initialValue` from `row`.

### External ids: `hiddenFields`

A schema field with no column — typically the PARENT row's id when the
table lives inside another table's expanded row — rides along as a hidden
input, exactly like the row id already does:

```svelte
{#snippet rowDetails({ row })}
  <Table
    rows={row.children}
    rowKey={(child) => child.id}
    createForm={createChild}
    createSchema={createChildSchema}
    hiddenFields={[{ key: "parentId", value: row.id }]}
  >
    ...
  </Table>
{/snippet}
```

```ts
// The linkage is part of the schema; the handler reads it like any field.
const createChildSchema = v.object({
  parentId: v.pipe(v.string(), v.nonEmpty("required")),
  label: ...,
});
```

Entries whose key the current form's schema lacks are skipped, so create
and edit schemas may declare different subsets. The playground's
`sandbox/table-nested` route is the full worked example.

### Nested tables

A table inside an `expanded` row works — with one rule, enforced: **one
open editor per table tree**. Every editing table wraps its whole markup
in a `<form>`, and nested form elements corrupt each other's submits (the
browser associates fields with the nearest form). Opening an editor
therefore closes any descendant table's editor, and opening a descendant
editor while an ancestor is editing is refused with a console warning —
save or cancel the outer editor first.

## Layout features

- **Pinning**: `pin="left" | "right"` on a Column — pinned columns are
  reordered to their edge and **must declare `width`** (offsets fall back to
  declared widths during SSR; measured after hydration). The expander pins
  left and the actions column right automatically.
- **Sizing**: no `width` = auto-sized to content, single line; `width` =
  fixed + truncated with a tooltip (`tooltip` accessor overrides the hover
  text — useful with custom `cell` formatting).
- **Expansion**: an `expanded` snippet enables per-row chevrons; content
  renders full-width below the row, holds position under horizontal scroll,
  and any markup goes.
- **Fill + empty**: in a height-constrained container the table fills it;
  with zero rows the `empty` snippet (or `labels.table.empty`) shows,
  centered in the visible viewport.
- **Column groups**: `group="2026"` on adjacent columns renders one
  spanning cell in an extra header row (`scope="colgroup"`) — a year over
  its month columns. The group label sticks to the frozen edge while its
  span scrolls, so the year stays identifiable from any of its months, and
  gets pushed out by the next span. Both header rows stay sticky under
  vertical scroll. Pinned columns leave their group (a span can't be
  half-pinned); `groupHeaderCellClass` styles the row.
- **Initial scroll + jumps**: `initialColumn` glides the table smoothly to
  that column just after the pinned edge on mount (a multi-year calendar
  starts on the current year); applied once — later remounts keep the
  user's own position. `controller.scrollToColumn(key, { behavior:
"smooth" })` jumps any time, and is buffered when fired before the table
  mounts. Motion-safe: every smooth scroll downgrades to instant under
  `prefers-reduced-motion`.
- **Density**: `density="compact"` tightens everything — including editor
  inputs, via the core density context.
- **Loading**: `loading` veils the visible table (slight blur + spinner,
  interaction blocked, `role="status"` with `labels.table.loading` for
  screen readers). Wire it to a remote query's `.loading` — it flips true
  on every refresh, single-flight refreshes after edits included:
  `<Table rows={await rowsQuery} loading={rowsQuery.loading} …>`.

## Theming

Per-instance: `class` (root scroll wrapper), `tableClass`, `headerCellClass`,
`cellClass`, `rowClass`, `editorRowClass`. Library-wide: the skin lives in
**`theme.ts`** (`tableTheme`) — colors, paddings, radius, scrollbars —
separated from the mechanics. Two calibration rules are documented in that
file: keep the given backgrounds opaque (pinned columns mask scrolling
content with them), and the editor-cell padding pairs with the core input's
height.

## Testing

`testing/fakes.svelte.ts` adds `fakeEditableRemoteForm` /
`fakeKeyedRemoteForm` on top of the forms fakes for table specs. Note for
geometry assertions: load Tailwind explicitly
(`import "@privaty/ui/testing/tailwind.css"`) — component classes are inert
in the test browser otherwise — and headless Chromium always uses OVERLAY
scrollbars, so classic-scrollbar geometry cannot be asserted there.
