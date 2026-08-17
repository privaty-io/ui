<script lang="ts" generics="Row">
  import { onDestroy, type Snippet } from "svelte";
  import { getTableContext } from "./context";
  import type { EditorField } from "./types";

  interface Props {
    key: string;
    label: string;

    /** One accessor serves display, the default sort, and edit seeding. */
    value: (row: Row) => unknown;

    /** CSS length fixing the column's width. Required for pinned columns —
     * pin offsets are computed from declared widths. */
    width?: string;
    /** Pins the column to a table edge; pinned columns are reordered to
     * their edge and stay visible under horizontal scroll. */
    pin?: "left" | "right";

    sortable?: boolean;
    compare?: (a: Row, b: Row) => number;

    /** Seed for this column's field when the create editor opens. */
    createSeed?: unknown;

    /** Cell tooltip text — defaults to the raw value as text. */
    tooltip?: (row: Row) => string;

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
