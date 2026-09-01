/**
 * Root barrel for `@privaty/ui-tables`. Every export here is also reachable
 * via its deep subpath (e.g. `@privaty/ui-tables/table.svelte`). The
 * testing fakes stay deep-only:
 * `@privaty/ui-tables/testing/fakes.svelte.js`.
 */

export { default as Column } from "./column.svelte";
export { TableController } from "./table-controller.svelte";
export { default as Table } from "./table.svelte";
export { tableTheme } from "./theme";
export type {
  ColumnRegistration,
  EditorField,
  HiddenField,
  HiddenFieldAttributes,
  RowKey,
  RowOf,
  RowsSource,
  TableEditor,
} from "./types";
