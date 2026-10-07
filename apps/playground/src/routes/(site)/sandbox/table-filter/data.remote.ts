import { query } from "$app/server";
import type { AnyWhereInput } from "@privaty/query";

import { productQuery } from "./query";

export interface Product {
  id: string;
  name: string;
  price: number | null;
  category: "cheese" | "wine" | "bread";
  hidden: boolean;
  supplierId: string;
}

const suppliers: Record<string, string> = {
  s1: "Fromagerie Petit",
  s2: "Bodega Ríos",
  s3: "Boulangerie Nord",
};

const products: Product[] = [
  {
    id: "p1",
    name: "Comté 18mo",
    price: 89,
    category: "cheese",
    hidden: false,
    supplierId: "s1",
  },
  {
    id: "p2",
    name: "Époisses",
    price: 74,
    category: "cheese",
    hidden: false,
    supplierId: "s1",
  },
  {
    id: "p3",
    name: "Rioja Reserva",
    price: 129,
    category: "wine",
    hidden: false,
    supplierId: "s2",
  },
  {
    id: "p4",
    name: "Albariño",
    price: 64,
    category: "wine",
    hidden: false,
    supplierId: "s2",
  },
  {
    id: "p5",
    name: "Sourdough",
    price: 42,
    category: "bread",
    hidden: false,
    supplierId: "s3",
  },
  {
    id: "p6",
    name: "Baguette",
    price: 18,
    category: "bread",
    hidden: false,
    supplierId: "s3",
  },
  {
    id: "p7",
    name: "Vintage Port",
    price: 210,
    category: "wine",
    hidden: false,
    supplierId: "s2",
  },
  {
    id: "p8",
    name: "Brie de Meaux",
    price: 55,
    category: "cheese",
    hidden: false,
    supplierId: "s1",
  },
  {
    id: "p9",
    name: "Test batch",
    price: null,
    category: "bread",
    hidden: true,
    supplierId: "s3",
  },
  {
    id: "p10",
    name: "Staff wine",
    price: 12,
    category: "wine",
    hidden: true,
    supplierId: "s2",
  },
];

// ---- A hand-rolled ARRAY converter — the "roll your own" story: ----
// implement the wire format against anything, here plain objects. The
// field→accessor map plays the drizzle converter's columnMap role,
// which is exactly how `supplierName` sorts a JOINED value.

type Accessor = (product: Product) => unknown;
const accessors: Record<string, Accessor> = {
  name: (product) => product.name,
  price: (product) => product.price,
  category: (product) => product.category,
  hidden: (product) => product.hidden,
  supplierName: (product) => suppliers[product.supplierId],
};

function opMatches(actual: unknown, op: string, operand: unknown): boolean {
  switch (op) {
    case "eq":
      return actual === operand;
    case "ne":
      return actual !== operand;
    case "gt":
      return actual != null && (actual as number) > (operand as number);
    case "gte":
      return actual != null && (actual as number) >= (operand as number);
    case "lt":
      return actual != null && (actual as number) < (operand as number);
    case "lte":
      return actual != null && (actual as number) <= (operand as number);
    case "in":
      return (operand as unknown[]).includes(actual);
    case "notIn":
      return !(operand as unknown[]).includes(actual);
    // Case-insensitive on purpose — a converter freedom (drizzle's
    // `like` is case-sensitive; this demo prefers forgiving search).
    case "contains":
      return String(actual)
        .toLowerCase()
        .includes(String(operand).toLowerCase());
    case "startsWith":
      return String(actual)
        .toLowerCase()
        .startsWith(String(operand).toLowerCase());
    case "endsWith":
      return String(actual)
        .toLowerCase()
        .endsWith(String(operand).toLowerCase());
    case "isNull":
      return actual == null;
    case "isNotNull":
      return actual != null;
    default:
      throw new Error(`No array mapping for operator "${op}".`);
  }
}

function matches(product: Product, node: AnyWhereInput): boolean {
  for (const [key, value] of Object.entries(node)) {
    if (value === undefined) continue;
    if (key === "and") {
      if (!(value as AnyWhereInput[]).every((n) => matches(product, n)))
        return false;
    } else if (key === "or") {
      if (!(value as AnyWhereInput[]).some((n) => matches(product, n)))
        return false;
    } else if (key === "not") {
      if (matches(product, value as AnyWhereInput)) return false;
    } else {
      const actual = accessors[key](product);
      for (const [op, operand] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (!opMatches(actual, op, operand)) return false;
      }
    }
  }
  return true;
}

// def.schema IS the server boundary: Kit validates the wire input with
// it before the handler runs — unknown fields, ungranted operators,
// and hostile nesting never reach the converter.
export const getProducts = query(
  productQuery.schema,
  // The input type infers from the schema — annotating it with the
  // generic QueryInput trips the variance wall (see AnyQueryInput).
  async (input): Promise<Product[]> => {
    // Let the veil breathe in the demo.
    await new Promise((resolve) => setTimeout(resolve, 300));

    let rows = products.filter((product) =>
      input.where ? matches(product, input.where) : true,
    );
    for (const term of [...(input.orderBy ?? [])].reverse()) {
      const accessor = accessors[term.field];
      const factor = term.dir === "desc" ? -1 : 1;
      rows = rows.toSorted((a, b) => {
        const left = accessor(a);
        const right = accessor(b);
        if (left == null) return 1;
        if (right == null) return -1;
        if (typeof left === "number" && typeof right === "number")
          return factor * (left - right);
        return factor * String(left).localeCompare(String(right));
      });
    }
    const offset = input.offset ?? 0;
    return rows.slice(offset, input.limit ? offset + input.limit : undefined);
  },
);
