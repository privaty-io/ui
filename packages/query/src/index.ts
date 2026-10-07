/**
 * Root barrel for `@privaty/query` — the CLIENT-SAFE core: field and
 * operator definitions, the validated wire format, and the schema that
 * guards it. Engine-free on purpose (lint-enforced); converters live
 * behind their own entry points (`@privaty/query/drizzle`) and never
 * leak into frontend bundles.
 */

export {
  contains,
  endsWith,
  eq,
  equality,
  gt,
  gte,
  ilike,
  isIn,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  membership,
  ne,
  notIn,
  nullable,
  ordering,
  pattern,
  scalar,
  startsWith,
  str,
  text,
} from "./operators.js";
export type { FieldKind, Operator, OperatorShape } from "./operators.js";

export { field } from "./fields.js";
export type { AnyFieldDef, FieldDef, FieldOptions } from "./fields.js";

export { defineQuery } from "./query.js";
export type {
  Fields,
  OrderByInput,
  QueryDef,
  QueryInput,
  QueryOptions,
  SortDirection,
  WhereInput,
} from "./query.js";
