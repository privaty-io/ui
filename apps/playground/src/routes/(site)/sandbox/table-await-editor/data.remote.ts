import { form, query } from "$app/server";
import * as v from "valibot";

interface Item {
  id: string;
  name: string;
  categoryId?: string;
}

const items: Item[] = [
  { id: "r1", name: "Comté", categoryId: "cc1" },
  { id: "r2", name: "Rioja", categoryId: "cc2" },
];

const updateItemSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("required")),
  name: v.pipe(v.string(), v.nonEmpty("required")),
  categoryId: v.optional(v.string()),
});

const getItems = query(async () => items);

// Slow on purpose: the editor snippet awaits this — the crash window is
// "options not yet resolved when the editor renders".
const getCategories = query(async () => {
  await new Promise<void>((resolve) => setTimeout(resolve, 400));
  return [
    { id: "cc1", label: "Restaurant" },
    { id: "cc2", label: "Retail" },
  ];
});

const updateItem = form(updateItemSchema, async (data) => {
  const item = items.find((entry) => entry.id === data.id);
  if (item) {
    item.name = data.name;
    item.categoryId = data.categoryId;
  }
  void getItems().refresh();
});

export { getCategories, getItems, updateItem };
export type { Item };
