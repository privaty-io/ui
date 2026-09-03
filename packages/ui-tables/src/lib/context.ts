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

const tableTreeKey = Symbol("privaty-ui-table-tree");

/**
 * A table's node in the NESTING tree — tables inside expanded rows
 * coordinate editors through it. Every editing table wraps its whole
 * markup in a <form>, and nested form elements corrupt each other's
 * submits (the browser associates fields with the nearest form), so only
 * one editor may be open per tree.
 */
interface TableTreeNode {
  parent: TableTreeNode | undefined;
  descendants: Set<TableTreeNode>;
  /** Whether this table currently has an editor open (or opening). */
  editing: () => boolean;
  /** Closes this table's editor (a no-op while idle). */
  closeEditor: () => void;
}

/** Installs a table's tree node — called by <Table> during its init. */
function setTableTree(node: TableTreeNode) {
  setContext<TableTreeNode>(tableTreeKey, node);
}

/** The nearest ANCESTOR table's tree node, or undefined at the root.
 * Must be called before {@link setTableTree} to see past this table. */
function getTableTree(): TableTreeNode | undefined {
  return getContext<TableTreeNode | undefined>(tableTreeKey);
}

export { getTableContext, getTableTree, setTableContext, setTableTree };
export type { TableTreeNode };
export type { TableContext };
