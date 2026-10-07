import * as v from "valibot";
import { describe, expect, expectTypeOf, test } from "vitest";

import {
  defineQuery,
  equality,
  field,
  nullable,
  ordering,
  scalar,
  str,
  text,
  type QueryInput,
} from "./index.js";

const fields = {
  name: field({ kind: "string", schema: v.string(), ops: str }),
  price: field({
    kind: "number",
    schema: v.number(),
    ops: [...scalar, ...ordering, ...nullable],
  }),
  active: field({
    kind: "boolean",
    schema: v.boolean(),
    ops: equality,
    sortable: false,
  }),
};
const q = defineQuery(fields);

const parse = (input: unknown) => v.parse(q.schema, input);
const fails = (input: unknown) =>
  v.safeParse(q.schema, input).success === false;

describe("the wire format", () => {
  test("accepts the ergonomic map style with implicit sibling AND", () => {
    const input = {
      where: { name: { contains: "comté" }, price: { gte: 10, lte: 100 } },
      orderBy: [{ field: "price", dir: "desc" }],
      limit: 50,
      offset: 100,
    };
    expect(parse(input)).toEqual(input);
  });

  test("accepts the full boolean algebra, nested", () => {
    const input = {
      where: {
        or: [
          { name: { startsWith: "ch" } },
          { and: [{ price: { gt: 50 } }, { not: { active: { eq: false } } }] },
        ],
      },
    };
    expect(parse(input)).toEqual(input);
  });

  test("list and flag shapes validate as such", () => {
    expect(
      parse({ where: { name: { in: ["a", "b"] }, price: { isNull: true } } }),
    ).toBeTruthy();
    expect(fails({ where: { name: { in: [] } } })).toBe(true);
    expect(fails({ where: { name: { in: "a" } } })).toBe(true);
    expect(fails({ where: { price: { isNull: false } } })).toBe(true);
  });

  test("rejects what the definition never granted", () => {
    // Unknown field…
    expect(fails({ where: { stock: { eq: 1 } } })).toBe(true);
    // …an operator the field doesn't grant…
    expect(fails({ where: { active: { contains: "x" } } })).toBe(true);
    // …a wrongly typed value…
    expect(fails({ where: { price: { gte: "10" } } })).toBe(true);
    // …and empty nodes or conditions.
    expect(fails({ where: {} })).toBe(true);
    expect(fails({ where: { name: {} } })).toBe(true);
    expect(fails({ where: { and: [] } })).toBe(true);
  });

  test("the depth cap is structural: nesting past maxDepth is not in the schema", () => {
    const nest = (depth: number): Record<string, unknown> =>
      depth === 0 ? { name: { eq: "x" } } : { and: [nest(depth - 1)] };
    expect(v.safeParse(q.schema, { where: nest(4) }).success).toBe(true);
    expect(fails({ where: nest(5) })).toBe(true);
  });

  test("orderBy only offers sortable fields; limit is capped", () => {
    expect(fails({ orderBy: [{ field: "active" }] })).toBe(true);
    expect(fails({ orderBy: [] })).toBe(true);
    expect(fails({ limit: 0 })).toBe(true);
    expect(fails({ limit: 101 })).toBe(true);
    expect(fails({ offset: -1 })).toBe(true);
    expect(parse({ limit: 100, offset: 0 })).toBeTruthy();
  });

  test("group keys are reserved as field names", () => {
    expect(() =>
      defineQuery({
        or: field({ kind: "string", schema: v.string(), ops: equality }),
      }),
    ).toThrow(/reserved/);
  });
});

describe("compile-time gating", () => {
  test("kinds gate operators and the input type follows the definition", () => {
    // A number field cannot be granted text operators (a runtime no-op —
    // the field builder stores whatever it is given; the TYPE is the gate).
    // @ts-expect-error — contains is string-only
    const misgranted = field({ kind: "number", schema: v.number(), ops: text });
    expect(misgranted.kind).toBe("number");

    type Input = QueryInput<typeof fields>;
    expectTypeOf<Input["where"]>().toExtend<
      { name?: { contains?: string }; price?: { gte?: number } } | undefined
    >();
    // Value types ride the field's schema.
    expectTypeOf<
      NonNullable<NonNullable<Input["where"]>["price"]>["gte"]
    >().toEqualTypeOf<number | undefined>();
  });
});
