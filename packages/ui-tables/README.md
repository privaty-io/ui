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
- **Density**: `density="compact"` tightens everything — including editor
  inputs, via the core density context.

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
