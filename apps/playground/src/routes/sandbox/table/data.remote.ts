import { command, form, query } from "$app/server";
import * as v from "valibot";
import { createRowSchema, updateRowSchema } from "./schema";

interface Row {
  id: string;
  name: string;
  price: number;
}

const rows: Row[] = [];

const getRows = query(async () => rows);

const createRow = form(createRowSchema, async (data) => {
  rows.push({ id: crypto.randomUUID(), name: data.name, price: data.price });

  void getRows().refresh();
});

const updateRow = form(updateRowSchema, async (data) => {
  const row = rows.find((candidate) => candidate.id === data.id);
  if (!row) return { updated: false };

  row.name = data.name;
  row.price = data.price;

  void getRows().refresh();

  return { updated: true };
});

// Deletes fit Kit's `command` (imperative, no form element — a per-row
// delete <form> could not nest inside the table's wrapping edit form);
// refreshing the query in the handler rides the same single-flight update.
const deleteRow = command(v.string(), async (id) => {
  const index = rows.findIndex((candidate) => candidate.id === id);
  if (index !== -1) rows.splice(index, 1);

  void getRows().refresh();
});

export { createRow, deleteRow, getRows, updateRow };
