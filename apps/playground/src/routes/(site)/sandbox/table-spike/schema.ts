import * as v from "valibot";

const rowFields = {
  name: v.pipe(v.string(), v.nonEmpty("required"), v.maxLength(30, "too-long")),
  price: v.pipe(v.number("required"), v.minValue(0, "too-small")),
};

const createRowSchema = v.object(rowFields);

// The row id travels IN the data (hidden input in the editor row) —
// `.for(key)` only routes the client instance and its cached result/issues;
// the server handler never receives the key itself.
const updateRowSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("required")),
  ...rowFields,
});

export { createRowSchema, updateRowSchema };
