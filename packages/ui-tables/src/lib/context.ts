import { getContext, setContext } from "svelte";
import type { ColumnRegistration } from "./types";

const tableContextKey = Symbol("privaty-ui-table-context");

/** What a <Table> provides to the column components rendered in its
 * children. */
interface TableContext {
  /**
   * `never` on purpose: the row type only appears in parameter (input)
   * positions, so any ColumnRegistration<Row> is assignable here — and the
   * Table casts back to its own row type when reading the registry.
   */
  register: (registration: ColumnRegistration<never>) => () => void;
}

/** Installs the table context — called by <Table> during its init, before
 * its children (the columns) render. */
function setTableContext(context: TableContext) {
  setContext<TableContext>(tableContextKey, context);
}

/** Reads the enclosing <Table>'s context. Throws when called outside a
 * <Table>. */
function getTableContext(): TableContext {
  const context = getContext<TableContext>(tableContextKey);

  if (!context)
    throw new Error(
      "TableContext: table components must be used inside a <Table>",
    );

  return context;
}

export { getTableContext, setTableContext };
export type { TableContext };
