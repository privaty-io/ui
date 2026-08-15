import { form, query } from "$app/server";
import { createItemSchema } from "./schema";

interface Item {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category: string;
  inStock: boolean;
}

const items: Item[] = [];

const getItems = query(async () => items);

const createItem = form(createItemSchema, async (data) => {
  items.push({
    id: crypto.randomUUID(),
    name: data.name,
    description: data.description,
    price: data.price,
    category: data.category,
    inStock: data.inStock,
  });

  void getItems().refresh();
});

export { createItem, getItems };
