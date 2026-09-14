import * as v from "valibot";

const childFields = {
  label: v.pipe(
    v.string(),
    v.nonEmpty("required"),
    v.maxLength(30, "too-long"),
  ),
};

// The parent linkage travels as a HIDDEN input the inner table renders
// (Table's hiddenFields prop) — it has no column.
const createChildSchema = v.object({
  parentId: v.pipe(v.string(), v.nonEmpty("required")),
  ...childFields,
});

const updateChildSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("required")),
  ...childFields,
});

const updateParentSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("required")),
  name: v.pipe(v.string(), v.nonEmpty("required")),
});

export { createChildSchema, updateChildSchema, updateParentSchema };
