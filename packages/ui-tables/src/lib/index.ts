/**
 * Root barrel for `@privaty/ui-tables` — the package's ONLY app-facing
 * module. The testing fakes live behind their own barrel,
 * `@privaty/ui-tables/testing`. Folder layout is internal.
 */

export { default as Column } from "./column.svelte";
export { default as FilterBar } from "./filter-bar/filter-bar.svelte";
export type { FilterPreset } from "./filter-bar/filter-bar.svelte";
export { TableController } from "./table-controller/table-controller.svelte";
export { default as Table } from "./table/table.svelte";
export { tableTheme } from "./theme";
export type {
  ColumnEditorGroup,
  ColumnRegistration,
  EditorField,
  HiddenField,
  HiddenFieldAttributes,
  RowKey,
  RowOf,
  RowsSource,
  TableEditor,
} from "./types";
