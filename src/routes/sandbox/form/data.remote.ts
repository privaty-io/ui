import { form, query } from "$app/server";
import { createItemSchema } from "./schema";

interface Item {
  id: string;
  name: string;
  description?: string;
}

const items: Item[] = [];

const getItems = query(async () => items);

const createItem = form(createItemSchema, async (data) => {
  items.push({
    id: crypto.randomUUID(),
    name: data.name,
    description: data.description,
  });

  void getItems().refresh();
});

export { createItem, getItems };
