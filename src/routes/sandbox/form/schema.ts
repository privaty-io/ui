import * as v from "valibot";

const createItemSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("required"), v.maxLength(50, "too-long")),
  description: v.optional(v.string()),
});

export { createItemSchema };
