import { form, query } from "$app/server";
import { createItemSchema } from "./schema";

interface Item {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category: string;
  availableFrom: string;
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
    availableFrom: data.availableFrom,
    inStock: data.inStock,
  });

  void getItems().refresh();
});

export { createItem, getItems };
