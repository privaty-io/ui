import * as v from "valibot";

const regions = ["france", "spain", "portugal", "germany"] as const;

// One message at a time: valibot pipes run every action even after a
// failure, so nonEmpty+format would stack BOTH messages on an empty
// field. The format check passes on "" — empty shows only "required",
// non-empty-but-invalid only the format code.
const requiredMatching = (pattern: RegExp, message: string) =>
  v.pipe(
    v.string(),
    v.check((value) => value.length > 0, "required"),
    v.check((value) => value === "" || pattern.test(value), message),
  );

const createSupplierSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("required"), v.maxLength(60, "too-long")),
  email: requiredMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "invalid-email"),
  // Optional and clearable — "" normalizes to undefined at the boundary.
  region: v.optional(
    v.pipe(
      v.string(),
      v.transform((value) => value || undefined),
    ),
  ),
  contractStart: requiredMatching(/^\d{4}-\d{2}-\d{2}$/, "invalid-date"),
  billingMonth: requiredMatching(/^\d{4}-\d{2}$/, "invalid-month"),
  deliveryWeek: requiredMatching(/^\d{4}-W\d{2}$/, "invalid-week"),
  notes: v.optional(v.string()),
  // Unchecked submits NOTHING — the schema supplies the false.
  organic: v.optional(v.boolean(), false),
});

export { createSupplierSchema, regions };
