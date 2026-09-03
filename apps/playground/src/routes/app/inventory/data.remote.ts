import { command, form, query } from "$app/server";
import * as v from "valibot";
import {
  createBatchSchema,
  createProductSchema,
  updateBatchSchema,
  updateProductSchema,
} from "./schema";

interface Product {
  id: string;
  name: string;
  categoryId?: string;
  price: number;
  stock: number;
  restocked: string;
}

interface Batch {
  id: string;
  productId: string;
  code: string;
  size: number;
}

const categories = [
  { id: "cat-cheese", label: "Cheese" },
  { id: "cat-wine", label: "Wine" },
  { id: "cat-bread", label: "Bread" },
];

const products: Product[] = [
  {
    id: "prod-1",
    name: "Comté 18mo",
    categoryId: "cat-cheese",
    price: 89,
    stock: 14,
    restocked: "2026-08-12",
  },
  {
    id: "prod-2",
    name: "Rioja Reserva",
    categoryId: "cat-wine",
    price: 129,
    stock: 42,
    restocked: "2026-07-30",
  },
  {
    id: "prod-3",
    name: "Sourdough",
    categoryId: "cat-bread",
    price: 42,
    stock: 7,
    restocked: "2026-09-01",
  },
  {
    id: "prod-4",
    name: "Gift basket",
    categoryId: undefined,
    price: 249,
    stock: 3,
    restocked: "2026-06-15",
  },
  {
    id: "prod-5",
    name: "Époisses",
    categoryId: "cat-cheese",
    price: 74,
    stock: 9,
    restocked: "2026-08-27",
  },
];

const batches: Batch[] = [
  { id: "batch-1", productId: "prod-1", code: "CT-2608", size: 20 },
  { id: "batch-2", productId: "prod-1", code: "CT-2611", size: 12 },
  { id: "batch-3", productId: "prod-2", code: "RJ-1102", size: 60 },
];

// A touch of latency so loading states are OBSERVABLE, not theoretical.
const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const getProducts = query(async () => {
  await delay(150);
  return products;
});

const getCategoryOptions = query(async () => {
  await delay(200);
  return categories;
});

const getBatches = query(v.string(), async (productId) =>
  batches.filter((batch) => batch.productId === productId),
);

const createProduct = form(createProductSchema, async (data) => {
  products.push({ id: crypto.randomUUID(), ...data });
  void getProducts().refresh();
});

const updateProduct = form(updateProductSchema, async (data) => {
  const product = products.find((entry) => entry.id === data.id);
  if (product) {
    product.name = data.name;
    product.categoryId = data.categoryId;
    product.price = data.price;
    product.stock = data.stock;
    product.restocked = data.restocked;
  }
  void getProducts().refresh();
});

const deleteProduct = command(v.string(), async (id) => {
  const index = products.findIndex((entry) => entry.id === id);
  if (index !== -1) products.splice(index, 1);
  void getProducts().refresh();
});

const createBatch = form(createBatchSchema, async (data) => {
  batches.push({ id: crypto.randomUUID(), ...data });
  void getBatches(data.productId).refresh();
});

const updateBatch = form(updateBatchSchema, async (data) => {
  const batch = batches.find((entry) => entry.id === data.id);
  if (batch) {
    batch.code = data.code;
    batch.size = data.size;
  }
  if (batch) void getBatches(batch.productId).refresh();
});

export {
  createBatch,
  createProduct,
  deleteProduct,
  getBatches,
  getCategoryOptions,
  getProducts,
  updateBatch,
  updateProduct,
};
export type { Batch, Product };
