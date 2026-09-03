import * as v from "valibot";

const regions = ["france", "spain", "portugal", "germany"] as const;

const createSupplierSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("required"), v.maxLength(60, "too-long")),
  email: v.pipe(v.string(), v.nonEmpty("required"), v.email("invalid-email")),
  // Optional and clearable — "" normalizes to undefined at the boundary.
  region: v.optional(
    v.pipe(
      v.string(),
      v.transform((value) => value || undefined),
    ),
  ),
  contractStart: v.pipe(
    v.string(),
    v.nonEmpty("required"),
    v.regex(/^\d{4}-\d{2}-\d{2}$/, "invalid-date"),
  ),
  billingMonth: v.pipe(
    v.string(),
    v.nonEmpty("required"),
    v.regex(/^\d{4}-\d{2}$/, "invalid-month"),
  ),
  deliveryWeek: v.pipe(
    v.string(),
    v.nonEmpty("required"),
    v.regex(/^\d{4}-W\d{2}$/, "invalid-week"),
  ),
  notes: v.optional(v.string()),
  // Unchecked submits NOTHING — the schema supplies the false.
  organic: v.optional(v.boolean(), false),
});

export { createSupplierSchema, regions };
