/**
 * The drizzle converter — the first drop-in execution target for a
 * validated query. SERVER-ONLY territory: this entry point is what the
 * core/converter split exists for, so import it next to your drizzle
 * schema, never in shared code. Works for any drizzle dialect (the
 * operators used here are dialect-agnostic); grant `ilike` only where
 * the engine has it (postgres).
 */

import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  not,
  notInArray,
  or,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";

import type { Fields, QueryDef, QueryInput, WhereInput } from "../query.js";

/** Field key → drizzle column. Binding happens HERE, at the edge — the
 * definition itself never knows a column exists. */
export type ColumnMap<Fs extends Fields> = { [K in keyof Fs]: AnyColumn };

export interface DrizzleQuery<Fs extends Fields> {
  /** The validated where tree as one drizzle condition (undefined when
   * the input has no filter) — hand it to `.where(...)`. */
  where(input: QueryInput<Fs>): SQL | undefined;
  /** The validated sort as drizzle order terms (empty when absent) —
   * spread into `.orderBy(...)`. */
  orderBy(input: QueryInput<Fs>): SQL[];
}

/** `%`/`_`/`\` in a contains/startsWith/endsWith VALUE are literals,
 * never wildcards. (Postgres treats `\` as the LIKE escape by default;
 * on the sqlite family add an explicit ESCAPE clause if you need
 * literal wildcards there — see the README.) */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function operatorSql(
  column: AnyColumn,
  name: string,
  value: unknown,
): SQL | undefined {
  switch (name) {
    case "eq":
      return eq(column, value);
    case "ne":
      return ne(column, value);
    case "gt":
      return gt(column, value);
    case "gte":
      return gte(column, value);
    case "lt":
      return lt(column, value);
    case "lte":
      return lte(column, value);
    case "in":
      return inArray(column, value as unknown[]);
    case "notIn":
      return notInArray(column, value as unknown[]);
    case "contains":
      return like(column, `%${escapeLike(String(value))}%`);
    case "startsWith":
      return like(column, `${escapeLike(String(value))}%`);
    case "endsWith":
      return like(column, `%${escapeLike(String(value))}`);
    case "like":
      return like(column, String(value));
    case "ilike":
      return ilike(column, String(value));
    case "isNull":
      return isNull(column);
    case "isNotNull":
      return isNotNull(column);
    default:
      throw new Error(`No drizzle mapping for operator "${name}".`);
  }
}

/** Bind a query definition to drizzle columns. Feed its methods ONLY
 * input that has passed `def.schema` — the converter trusts the
 * validated wire format and does no validation of its own. */
export function drizzleQuery<Fs extends Fields>(
  def: QueryDef<Fs>,
  columns: ColumnMap<Fs>,
): DrizzleQuery<Fs> {
  for (const key of Object.keys(def.fields)) {
    if (!(key in columns)) {
      throw new Error(`No column bound for field "${key}".`);
    }
  }

  function condition(
    key: string,
    operators: Record<string, unknown>,
  ): SQL | undefined {
    const column = columns[key as keyof Fs];
    return and(
      ...Object.entries(operators).map(([name, value]) =>
        operatorSql(column, name, value),
      ),
    );
  }

  function node(input: WhereInput<Fs>): SQL | undefined {
    const parts: (SQL | undefined)[] = [];
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      if (key === "and") {
        parts.push(and(...(value as WhereInput<Fs>[]).map(node)));
      } else if (key === "or") {
        parts.push(or(...(value as WhereInput<Fs>[]).map(node)));
      } else if (key === "not") {
        const inner = node(value as WhereInput<Fs>);
        if (inner) parts.push(not(inner));
      } else {
        parts.push(condition(key, value as Record<string, unknown>));
      }
    }
    return and(...parts);
  }

  return {
    where(input) {
      return input.where ? node(input.where) : undefined;
    },
    orderBy(input) {
      return (input.orderBy ?? []).map(({ field, dir }) =>
        dir === "desc"
          ? desc(columns[field as keyof Fs])
          : asc(columns[field as keyof Fs]),
      );
    },
  };
}
