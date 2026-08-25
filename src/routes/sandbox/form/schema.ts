import * as v from "valibot";

const categories = ["cheese", "wine", "bread"] as const;

const createItemSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("required"), v.maxLength(50, "too-long")),
  description: v.optional(v.string()),
  price: v.optional(v.pipe(v.number(), v.minValue(0, "too-small"))),
  // The disabled placeholder option is skipped by form submission entirely,
  // so an untouched select is ABSENT from the data: default it to "" so the
  // picklist rejects it with this field's own message instead of valibot's
  // raw missing-key error. (The canonical placeholder-select recipe.)
  category: v.pipe(
    v.optional(v.string(), ""),
    v.picklist(categories, "required"),
  ),
  // Month inputs submit "YYYY-MM" strings; an empty one submits "", which
  // nonEmpty turns into this field's own required code.
  availableFrom: v.pipe(
    v.string(),
    v.nonEmpty("required"),
    v.regex(/^\d{4}-\d{2}$/, "invalid-month"),
  ),
  // Unchecked checkboxes are absent from the submitted data entirely, so the
  // schema must supply the false. (The canonical checkbox recipe.)
  inStock: v.optional(v.boolean(), false),
});

export { categories, createItemSchema };
