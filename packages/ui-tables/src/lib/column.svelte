<!-- @component
Declares one table column. Render inside a <Table>'s children — a Column
registers its definition with the table during init and renders no markup of
its own. Props are captured once: updates after init are not observed, so a
column must be destroyed and recreated to change.
-->
<script lang="ts" generics="Row">
  import { onDestroy, type Snippet } from "svelte";
  import { getTableContext } from "./context";
  import type { EditorField } from "./types";

  interface Props {
    /** Unique column identity — and the field name looked up on the
     * create/edit form's `fields` when the column is editable. */
    key: string;
    /** Header text (also the header cell's tooltip). */
    label: string;

    /** One accessor serves display, the default sort, and edit seeding. */
    value: (row: Row) => unknown;

    /** CSS length fixing the column's width. Required for pinned columns —
     * pin offsets are computed from declared widths. */
    width?: string;
    /** Pins the column to a table edge; pinned columns are reordered to
     * their edge and stay visible under horizontal scroll. */
    pin?: "left" | "right";

    /** Renders the header as a sort toggle cycling ascending → descending →
     * off. Defaults to false. */
    sortable?: boolean;
    /** Custom comparator for sorting — receives full rows and returns the
     * ascending order; the table negates it for descending. Without one,
     * `value` results are compared: numbers and Dates numerically, everything
     * else as localeCompare'd text, with nullish values last in both
     * directions. */
    compare?: (a: Row, b: Row) => number;

    /** Seed for this column's field when the create editor opens. */
    createSeed?: unknown;

    /** Cell tooltip text — defaults to the raw value as text. */
    tooltip?: (row: Row) => string;

    /** Replaces the default text rendering of the cell — receives the row
     * and its `value` result. The cell tooltip still defaults to the raw
     * value as text. */
    cell?: Snippet<[{ row: Row; value: unknown }]>;
    /** Present = the column is editable. `row` is undefined on the create
     * row. */
    editor?: Snippet<[{ field: EditorField; row: Row | undefined }]>;
  }

  const {
    key,
    label,
    value,
    width,
    pin,
    sortable = false,
    compare,
    createSeed,
    tooltip,
    cell,
    editor,
  }: Props = $props();

  // Registration happens during init — never in onMount/$effect — so the
  // Table can render its markup AFTER `{@render children()}` from a complete
  // column list, on the server as well as the client. The props are captured
  // once: a column's definition is stable for its lifetime.
  // svelte-ignore state_referenced_locally
  const unregister = getTableContext().register({
    key,
    label,
    value,
    width,
    pin,
    sortable,
    compare,
    createSeed,
    tooltip,
    cell,
    editor,
  });

  onDestroy(unregister);
</script>

<!-- A Column renders nothing — it only registers its definition. -->
