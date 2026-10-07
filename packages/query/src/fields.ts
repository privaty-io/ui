import type * as v from "valibot";

import type { FieldKind, Operator, OperatorShape } from "./operators.js";

/**
 * A filterable field: a value kind (gates operators at compile time), a
 * valibot schema for a SINGLE value (list operators wrap it in an
 * array), and the operators this field grants. No column, no engine —
 * converters bind field keys to their target (a drizzle column, a Go
 * struct field, …) at the edge.
 */
export interface FieldDef<
  K extends FieldKind = FieldKind,
  TSchema extends v.GenericSchema = v.GenericSchema,
  Ops extends readonly Operator<string, OperatorShape, never>[] = readonly [],
> {
  readonly kind: K;
  readonly schema: TSchema;
  readonly ops: Ops;
  readonly sortable: boolean;
}

// The loosest field anything generic can hold: `never` in the
// contravariant kind slot admits every operator.
export type AnyFieldDef = FieldDef<
  FieldKind,
  v.GenericSchema,
  readonly Operator<string, OperatorShape, never>[]
>;

export interface FieldOptions<
  K extends FieldKind,
  TSchema extends v.GenericSchema,
  Ops extends readonly Operator<string, OperatorShape, K>[],
> {
  /** The value kind — this is what the operator type-check runs on. */
  kind: K;
  /** Validates one value for this field. */
  schema: TSchema;
  /** The operators this field grants (spread the capability sets). */
  ops: Ops;
  /** Whether `orderBy` may use this field. Defaults to true. */
  sortable?: boolean;
}

/** Declare a filterable field. Granting an operator the kind doesn't
 * support is a COMPILE error (`contains` on a number field, say). */
export function field<
  K extends FieldKind,
  TSchema extends v.GenericSchema,
  const Ops extends readonly Operator<string, OperatorShape, K>[],
>(options: FieldOptions<K, TSchema, Ops>): FieldDef<K, TSchema, Ops> {
  return {
    kind: options.kind,
    schema: options.schema,
    ops: options.ops,
    sortable: options.sortable ?? true,
  };
}
