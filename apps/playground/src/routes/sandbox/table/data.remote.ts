import { command, form, query } from "$app/server";
import * as v from "valibot";
import { createRowSchema, updateRowSchema } from "./schema";

interface Row {
  id: string;
  name: string;
  price: number;
}

// A deterministic, decently-sized seed: enough rows for vertical scroll and
// realistic column widths from the first paint. r1/r2 keep their well-known
// ids — the sandbox's "edit from outside" button targets r2.
const names = [
  "Comté",
  "Rioja",
  "Manchego",
  "Chablis",
  "Gorgonzola",
  "Barolo",
  "Halloumi",
  "Sancerre",
  "Taleggio",
  "Amarone",
  "Roquefort",
  "Vermentino",
];
const rows: Row[] = Array.from({ length: 24 }, (_, index) => ({
  id: index < 2 ? `r${index + 1}` : `seed-${index + 1}`,
  name: `${names[index % names.length]}${index >= names.length ? ` №${Math.floor(index / names.length) + 1}` : ""}`,
  price: 49 + ((index * 37) % 160),
}));

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
