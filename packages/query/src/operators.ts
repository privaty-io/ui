/**
 * The operator vocabulary — names and input shapes ONLY. No SQL, no
 * engine: converters map names to their target, which is what keeps the
 * core client-safe and, one day, implementable in another language.
 */

/** The value kinds a field can declare. Kinds gate which operators the
 * TYPE SYSTEM admits; the field's valibot schema gates the VALUES. */
export type FieldKind = "string" | "number" | "boolean" | "date";

/** How an operator's input travels: one value, a non-empty list of
 * values, or a bare `true` flag (isNull / isNotNull). */
export type OperatorShape = "value" | "list" | "flag";

/**
 * An operator. `TKind` is a phantom, CONTRAVARIANT parameter (carried by
 * the never-called `__kind` function property): an operator declared
 * for every kind is assignable wherever a narrower kind is required, so
 * `field({ kind: "number", ops: [eq, contains] })` fails to compile on
 * `contains` alone.
 */
export interface Operator<
  TName extends string = string,
  TShape extends OperatorShape = OperatorShape,
  in TKind extends FieldKind = FieldKind,
> {
  readonly name: TName;
  readonly shape: TShape;
  /** Phantom carrier for `TKind` — never present at runtime. */
  readonly __kind?: (kind: TKind) => void;
}

function op<
  TName extends string,
  TShape extends OperatorShape,
  TKind extends FieldKind = FieldKind,
>(name: TName, shape: TShape): Operator<TName, TShape, TKind> {
  return { name, shape };
}

// Equality — every kind.
export const eq = op("eq", "value");
export const ne = op("ne", "value");

// Ordering — anything with a total order on the wire.
type Ordered = "number" | "date" | "string";
export const gt = op<"gt", "value", Ordered>("gt", "value");
export const gte = op<"gte", "value", Ordered>("gte", "value");
export const lt = op<"lt", "value", Ordered>("lt", "value");
export const lte = op<"lte", "value", Ordered>("lte", "value");

// Membership — every kind. (`in` is a reserved word; the WIRE name is
// still "in".)
export const isIn = op("in", "list");
export const notIn = op("notIn", "list");

// Text — substring semantics, case-sensitive; converters escape the
// user's value (it is a VALUE, never a pattern).
export const contains = op<"contains", "value", "string">("contains", "value");
export const startsWith = op<"startsWith", "value", "string">(
  "startsWith",
  "value",
);
export const endsWith = op<"endsWith", "value", "string">("endsWith", "value");

// Pattern — the raw escape hatches: the VALUE IS the pattern, wildcards
// and all. Grant these deliberately.
export const like = op<"like", "value", "string">("like", "value");
export const ilike = op<"ilike", "value", "string">("ilike", "value");

// Null tests — flags, every kind.
export const isNull = op("isNull", "flag");
export const isNotNull = op("isNotNull", "flag");

/** Capability sets — spread them into a field's `ops`. */
export const equality = [eq, ne] as const;
export const ordering = [gt, gte, lt, lte] as const;
export const membership = [isIn, notIn] as const;
export const text = [contains, startsWith, endsWith] as const;
export const pattern = [like, ilike] as const;
export const nullable = [isNull, isNotNull] as const;

/** Equality + membership: the sensible floor for any field. */
export const scalar = [...equality, ...membership] as const;
/** Everything a string column usually wants (minus the raw patterns). */
export const str = [...scalar, ...ordering, ...text] as const;
