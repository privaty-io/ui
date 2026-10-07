import * as v from "valibot";

import type { AnyFieldDef } from "./fields.js";

/** The field map a query is defined over. */
export type Fields = Record<string, AnyFieldDef>;

export type SortDirection = "asc" | "desc";

type OpValue<
  F extends AnyFieldDef,
  O extends F["ops"][number],
> = O["shape"] extends "value"
  ? v.InferOutput<F["schema"]>
  : O["shape"] extends "list"
    ? readonly v.InferOutput<F["schema"]>[]
    : true;

type ConditionInput<F extends AnyFieldDef> = {
  [O in F["ops"][number] as O["name"]]?: OpValue<F, O>;
};

/**
 * One node of the where tree — THE wire format. Sibling entries are an
 * implicit AND (the ergonomic map style); `and`/`or`/`not` build the
 * full boolean algebra. This shape is the cross-language contract:
 * plain JSON, no engine, no language in it.
 */
export type WhereInput<Fs extends Fields> = {
  and?: readonly WhereInput<Fs>[];
  or?: readonly WhereInput<Fs>[];
  not?: WhereInput<Fs>;
} & { [K in keyof Fs]?: ConditionInput<Fs[K]> };

export interface OrderByInput<Fs extends Fields> {
  field: keyof Fs & string;
  dir?: SortDirection;
}

/** A full validated query: filter, sort, pagination. */
export interface QueryInput<Fs extends Fields = Fields> {
  where?: WhereInput<Fs>;
  orderBy?: readonly OrderByInput<Fs>[];
  limit?: number;
  offset?: number;
}

export interface QueryOptions {
  /** Maximum `and`/`or`/`not` nesting depth the schema accepts — a
   * structural cap, not a runtime walk, so hostile input cannot build
   * towers. Defaults to 4. */
  maxDepth?: number;
  /** Maximum accepted `limit`. Defaults to 100. */
  maxLimit?: number;
  /** Maximum entries a list operator (`in`/`notIn`) accepts.
   * Defaults to 100. */
  maxListLength?: number;
}

export interface QueryDef<Fs extends Fields = Fields> {
  readonly fields: Fs;
  /** Validates an untrusted `QueryInput` — THE boundary. Converters
   * must only ever see output of this schema. */
  readonly schema: v.GenericSchema<QueryInput<Fs>>;
  readonly options: Required<QueryOptions>;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- the erased
   aliases below exist for GENERIC consumers (UI components treating
   definitions as data): `any` is the only variance-proof erasure —
   WhereInput's field map makes specific defs non-assignable to
   QueryDef<Fields>. */
/** A query definition with its field typing erased — what a generic
 * consumer (a table, a filter bar) should accept. */
export type AnyQueryDef = QueryDef<any>;
/** A query input with its field typing erased. */
export type AnyQueryInput = QueryInput<any>;
/** A where tree with its field typing erased. */
export type AnyWhereInput = WhereInput<any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

const GROUP_KEYS = ["and", "or", "not"] as const;

function conditionSchema(
  def: AnyFieldDef,
  maxListLength: number,
): v.GenericSchema {
  const entries: v.ObjectEntries = {};
  for (const op of def.ops) {
    const value =
      op.shape === "value"
        ? def.schema
        : op.shape === "list"
          ? v.pipe(
              v.array(def.schema),
              v.minLength(1, "A list operator needs at least one value."),
              v.maxLength(maxListLength),
            )
          : v.literal(true);
    entries[op.name] = v.optional(value);
  }
  return v.pipe(
    v.strictObject(entries),
    v.check(
      (condition) => Object.keys(condition).length > 0,
      "A field condition needs at least one operator.",
    ),
  );
}

/**
 * Define a validated query surface over a set of fields. The result is
 * engine-free and client-safe: a valibot schema for untrusted input
 * plus the field metadata a UI needs to render filter controls.
 * Converters (`@privaty/query/drizzle`, or your own) turn validated
 * input into execution.
 */
export function defineQuery<Fs extends Fields>(
  fields: Fs,
  options: QueryOptions = {},
): QueryDef<Fs> {
  for (const key of GROUP_KEYS) {
    if (key in fields) {
      throw new Error(
        `"${key}" is a reserved group key and cannot be a field name.`,
      );
    }
  }

  const resolved: Required<QueryOptions> = {
    maxDepth: options.maxDepth ?? 4,
    maxLimit: options.maxLimit ?? 100,
    maxListLength: options.maxListLength ?? 100,
  };

  const fieldEntries: v.ObjectEntries = {};
  for (const [key, def] of Object.entries(fields)) {
    fieldEntries[key] = v.optional(
      conditionSchema(def, resolved.maxListLength),
    );
  }

  const nonEmpty = v.check(
    (node: Record<string, unknown>) => Object.keys(node).length > 0,
    "A where group cannot be empty.",
  );

  // The recursion is UNROLLED to maxDepth instead of v.lazy: the depth
  // cap is then structural — deeper nesting is simply not part of the
  // schema — rather than a counter hostile input could race.
  let node: v.GenericSchema = v.pipe(
    v.strictObject({ ...fieldEntries }),
    nonEmpty,
  );
  for (let depth = 0; depth < resolved.maxDepth; depth += 1) {
    const inner = node;
    node = v.pipe(
      v.strictObject({
        ...fieldEntries,
        and: v.optional(v.pipe(v.array(inner), v.minLength(1))),
        or: v.optional(v.pipe(v.array(inner), v.minLength(1))),
        not: v.optional(inner),
      }),
      nonEmpty,
    );
  }

  const sortableKeys = Object.keys(fields).filter(
    (key) => fields[key].sortable,
  );

  const schema = v.strictObject({
    where: v.optional(node),
    ...(sortableKeys.length > 0
      ? {
          orderBy: v.optional(
            v.pipe(
              v.array(
                v.strictObject({
                  field: v.picklist(sortableKeys),
                  dir: v.optional(v.picklist(["asc", "desc"])),
                }),
              ),
              v.minLength(1),
              v.maxLength(sortableKeys.length),
            ),
          ),
        }
      : {}),
    limit: v.optional(
      v.pipe(
        v.number(),
        v.integer(),
        v.minValue(1),
        v.maxValue(resolved.maxLimit),
      ),
    ),
    offset: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  }) as unknown as v.GenericSchema<QueryInput<Fs>>;

  return { fields, schema, options: resolved };
}
