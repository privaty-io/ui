import * as v from "valibot";

const productFields = {
  name: v.pipe(v.string(), v.nonEmpty("required"), v.maxLength(40, "too-long")),
  // Optional and CLEARABLE in the UI; "" normalizes to undefined at the
  // schema boundary (the forms README recipe).
  categoryId: v.optional(
    v.pipe(
      v.string(),
      v.transform((value) => value || undefined),
    ),
  ),
  price: v.pipe(v.number("required"), v.minValue(0, "too-small")),
  stock: v.pipe(v.number("required"), v.minValue(0, "too-small")),
  // Two checks, not nonEmpty+regex: pipes run every action even after a
  // failure — an empty value would stack both messages.
  restocked: v.pipe(
    v.string(),
    v.check((value) => value.length > 0, "required"),
    v.check(
      (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "invalid-date",
    ),
  ),
};

const createProductSchema = v.object(productFields);

const updateProductSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("required")),
  ...productFields,
});

const batchFields = {
  code: v.pipe(v.string(), v.nonEmpty("required"), v.maxLength(20, "too-long")),
  size: v.pipe(v.number("required"), v.minValue(1, "too-small")),
};

// The product linkage rides as a hidden input (the Table's hiddenFields).
const createBatchSchema = v.object({
  productId: v.pipe(v.string(), v.nonEmpty("required")),
  ...batchFields,
});

const updateBatchSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("required")),
  ...batchFields,
});

export {
  createBatchSchema,
  createProductSchema,
  updateBatchSchema,
  updateProductSchema,
};
