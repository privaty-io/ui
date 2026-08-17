<script lang="ts" generics="Row">
  import { onDestroy, type Snippet } from "svelte";
  import { getTableContext } from "./context";
  import type { EditorField } from "./types";

  interface Props {
    key: string;
    label: string;

    /** One accessor serves display, the default sort, and edit seeding. */
    value: (row: Row) => unknown;

    sortable?: boolean;
    compare?: (a: Row, b: Row) => number;

    /** Seed for this column's field when the create editor opens. */
    createSeed?: unknown;

    cell?: Snippet<[{ row: Row; value: unknown }]>;
    /** Present = the column is editable. `row` is undefined on the create
     * row. */
    editor?: Snippet<[{ field: EditorField; row: Row | undefined }]>;
  }

  const {
    key,
    label,
    value,
    sortable = false,
    compare,
    createSeed,
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
    sortable,
    compare,
    createSeed,
    cell,
    editor,
  });

  onDestroy(unregister);
</script>

<!-- A Column renders nothing — it only registers its definition. -->
