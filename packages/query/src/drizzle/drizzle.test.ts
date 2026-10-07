import {
  boolean,
  integer,
  PgDialect,
  snakeCase,
  text as pgText,
} from "drizzle-orm/pg-core";
import * as v from "valibot";
import { describe, expect, test } from "vitest";

import {
  defineQuery,
  equality,
  field,
  nullable,
  ordering,
  pattern,
  scalar,
  str,
} from "../index.js";
import { drizzleQuery } from "./index.js";

const things = snakeCase.table("things", {
  name: pgText().notNull(),
  unitPrice: integer(),
  active: boolean().notNull(),
});

const q = defineQuery({
  // str deliberately excludes the raw pattern operators — this field
  // grants them EXPLICITLY for the pass-through test below.
  name: field({
    kind: "string",
    schema: v.string(),
    ops: [...str, ...pattern],
  }),
  price: field({
    kind: "number",
    schema: v.number(),
    ops: [...scalar, ...ordering, ...nullable],
  }),
  active: field({ kind: "boolean", schema: v.boolean(), ops: equality }),
});

const dq = drizzleQuery(q, {
  name: things.name,
  price: things.unitPrice,
  active: things.active,
});

const dialect = new PgDialect();
const render = (input: unknown) => {
  const where = dq.where(v.parse(q.schema, input));
  if (!where) return undefined;
  const query = dialect.sqlToQuery(where);
  return { sql: query.sql, params: query.params };
};

describe("drizzle converter", () => {
  test("conditions bind to their mapped columns", () => {
    expect(render({ where: { price: { gte: 10, lte: 99 } } })).toEqual({
      sql: '(("things"."unit_price" >= $1) and ("things"."unit_price" <= $2))',
      params: [10, 99],
    });
  });

  test("the boolean algebra maps to and/or/not", () => {
    const rendered = render({
      where: {
        or: [
          { name: { eq: "Comté" } },
          { and: [{ price: { gt: 50 } }, { not: { active: { eq: true } } }] },
        ],
      },
    });
    expect(rendered?.sql).toBe(
      '(("things"."name" = $1) or ((("things"."unit_price" > $2) and (not ("things"."active" = $3)))))',
    );
    expect(rendered?.params).toEqual(["Comté", 50, true]);
  });

  test("substring values are ESCAPED — the value is never a pattern", () => {
    expect(render({ where: { name: { contains: "50%_off\\" } } })).toEqual({
      sql: '"things"."name" like $1',
      params: ["%50\\%\\_off\\\\%"],
    });
    // …while the raw pattern operators pass the value through untouched.
    expect(render({ where: { name: { like: "50%" } } })?.params).toEqual([
      "50%",
    ]);
  });

  test("list and flag operators", () => {
    expect(render({ where: { name: { in: ["a", "b"] } } })).toEqual({
      sql: '"things"."name" in ($1, $2)',
      params: ["a", "b"],
    });
    expect(render({ where: { price: { isNull: true } } })?.sql).toBe(
      '("things"."unit_price" is null)',
    );
  });

  test("orderBy maps fields and directions, defaulting ascending", () => {
    const terms = dq.orderBy(
      v.parse(q.schema, {
        orderBy: [{ field: "price", dir: "desc" }, { field: "name" }],
      }),
    );
    expect(terms.map((term) => dialect.sqlToQuery(term).sql)).toEqual([
      '"things"."unit_price" desc',
      '"things"."name" asc',
    ]);
    expect(dq.orderBy(v.parse(q.schema, {}))).toEqual([]);
  });

  test("an unbound field is a construction-time error", () => {
    expect(() =>
      drizzleQuery(q, {
        name: things.name,
        price: things.unitPrice,
      } as never),
    ).toThrow(/No column bound/);
  });
});
