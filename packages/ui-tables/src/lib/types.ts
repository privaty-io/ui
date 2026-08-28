import type {
  CheckboxField,
  DateField,
  NumberField,
  SelectField,
  TextField,
} from "@privaty/ui-forms/types/field.js";
import type { Snippet } from "svelte";
import type { HTMLInputAttributes } from "svelte/elements";

/**
 * Row identity as the Table's `rowKey` accessor produces it. Deliberately
 * loose (string | number) so the controller API stays untied to any edit
 * schema's key type.
 */
type RowKey = string | number;

/**
 * A table's editor state: idle, the create row open, or one row open for
 * editing. Exactly one editor is active at a time.
 */
type TableEditor =
  { type: "idle" } | { type: "create" } | { type: "edit"; rowId: RowKey };

/**
 * The field handed to Column editor snippets. An intersection of every input
 * slice, so one snippet parameter satisfies whichever input the consumer
 * renders — the Table cannot know which. The Table casts the real remote
 * form field to this type; the lie is safe for the same reason the slices
 * are: inputs only call the members their own field actually has.
 */
type EditorField = TextField &
  NumberField &
  SelectField &
  CheckboxField &
  DateField;

/**
 * Spread attributes for the hidden row-id input, as returned by
 * `HiddenField.as("hidden", ...)`.
 */
type HiddenFieldAttributes = Omit<HTMLInputAttributes, "type"> & {
  name: string;
  type?: "hidden";
};

/**
 * The slice of the edit form's row-id field the Table needs: it renders the
 * id as a hidden input and reseeds it on edit entry. Same structural and
 * `set: never` reasoning as the forms field slices.
 */
interface HiddenField {
  /** Attributes for the hidden input, optionally seeding an initial value —
   * same tuple-union call shape as the forms field slices. */
  as(
    ...args: [type: "hidden"] | [type: "hidden", initialValue: string | number]
  ): HiddenFieldAttributes;
  /** Reseeds the row id on edit entry. Typed `never` so any concrete field's
   * `set` stays assignable to this slice — see the forms field slices. */
  set: (value: never) => void;
}

/**
 * A column's definition as captured by <Column> during its init and read by
 * the Table — mirrors Column's props.
 */
interface ColumnRegistration<Row> {
  /** Unique column identity — the registry key, and the field name looked up
   * on the create/edit form's `fields` when the column is editable. */
  key: string;
  /** Header text (also the header cell's tooltip). */
  label: string;

  /** One accessor serves display, the default sort, and edit seeding. */
  value: (row: Row) => unknown;

  /** CSS length fixing the column's width. Required for pinned columns —
   * pin offsets are computed from declared widths. */
  width?: string;
  /** Pins the column to a table edge; pinned columns are reordered to their
   * edge and stay visible under horizontal scroll. */
  pin?: "left" | "right";

  /** Renders the header as a sort toggle cycling ascending → descending →
   * off. */
  sortable: boolean;
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

  /** Replaces the default text rendering of the cell — receives the row and
   * its `value` result. */
  cell?: Snippet<[{ row: Row; value: unknown }]>;
  /** Present = the column is editable. `row` is undefined on the create row. */
  editor?: Snippet<[{ field: EditorField; row: Row | undefined }]>;
}

export type {
  ColumnRegistration,
  EditorField,
  HiddenField,
  HiddenFieldAttributes,
  RowKey,
  TableEditor,
};
