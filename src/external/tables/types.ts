import type {
  CheckboxField,
  NumberField,
  SelectField,
  TextField,
} from "#privaty/ui-forms/types/field.js";
import type { Snippet } from "svelte";
import type { HTMLInputAttributes } from "svelte/elements";

type RowKey = string | number;

type TableEditor =
  { type: "idle" } | { type: "create" } | { type: "edit"; rowId: RowKey };

/**
 * The field handed to Column editor snippets. An intersection of every input
 * slice, so one snippet parameter satisfies whichever input the consumer
 * renders — the Table cannot know which. The Table casts the real remote
 * form field to this type; the lie is safe for the same reason the slices
 * are: inputs only call the members their own field actually has.
 */
type EditorField = TextField & NumberField & SelectField & CheckboxField;

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
  as(
    ...args: [type: "hidden"] | [type: "hidden", initialValue: string | number]
  ): HiddenFieldAttributes;
  set: (value: never) => void;
}

interface ColumnRegistration<Row> {
  key: string;
  label: string;

  /** One accessor serves display, the default sort, and edit seeding. */
  value: (row: Row) => unknown;

  sortable: boolean;
  compare?: (a: Row, b: Row) => number;

  /** Seed for this column's field when the create editor opens. */
  createSeed?: unknown;

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
