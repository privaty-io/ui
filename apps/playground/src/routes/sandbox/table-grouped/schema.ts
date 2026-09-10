import * as v from "valibot";

// The grouped columns submit ONE array field: every month entry of the
// row in a single save — Kit reassembles months[i].month/.hours from the
// flat FormData.
const monthEntries = v.array(
  v.object({
    month: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}$/, "invalid-month")),
    hours: v.pipe(v.number("required"), v.minValue(0, "too-small")),
  }),
);

const createAllocationSchema = v.object({
  employee: v.pipe(v.string(), v.nonEmpty("required")),
  months: monthEntries,
});

const updateAllocationSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("required")),
  employee: v.pipe(v.string(), v.nonEmpty("required")),
  months: monthEntries,
});

const MONTH_KEYS = ["2026-01", "2026-02", "2026-03", "2026-04"];

export { createAllocationSchema, MONTH_KEYS, updateAllocationSchema };
