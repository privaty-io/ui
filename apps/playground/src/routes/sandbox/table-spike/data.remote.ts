import { form, query } from "$app/server";
import { createRowSchema, updateRowSchema } from "./schema";

interface Row {
  id: string;
  name: string;
  price: number;
}

// Stable readable ids so the `.for(key)` instances are easy to follow in
// devtools.
const rows: Row[] = [
  { id: "r1", name: "Comté", price: 89 },
  { id: "r2", name: "Rioja", price: 129 },
  { id: "r3", name: "Sourdough", price: 42 },
];

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

export { createRow, getRows, updateRow };
