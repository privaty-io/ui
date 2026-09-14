import { form, query } from "$app/server";
import { createAllocationSchema, updateAllocationSchema } from "./schema";

interface Allocation {
  id: string;
  employee: string;
  /** Hours per ISO month. */
  months: Record<string, number>;
}

const allocations: Allocation[] = [
  {
    id: "al-1",
    employee: "Lukas",
    months: { "2026-01": 120, "2026-02": 120, "2026-03": 80, "2026-04": 160 },
  },
  {
    id: "al-2",
    employee: "Nadia",
    months: { "2026-01": 160, "2026-02": 40, "2026-03": 160, "2026-04": 0 },
  },
];

const getAllocations = query(async () => allocations);

// The submitted entries fold into the Record the rows store. In the
// HANDLER, not a schema transform: an output-changing transform on the
// grouped field defeats the Table's generic inference from the schema.
// An entry without hours is a CLEARED cell — delete semantics: the month
// is dropped from the stored record instead of written as 0.
const foldMonths = (
  entries: { month: string; hours?: number }[],
): Record<string, number> =>
  Object.fromEntries(
    entries.flatMap((entry) =>
      entry.hours === undefined ? [] : [[entry.month, entry.hours] as const],
    ),
  );

const createAllocation = form(createAllocationSchema, async (data) => {
  allocations.push({
    id: crypto.randomUUID(),
    employee: data.employee,
    months: foldMonths(data.months),
  });
  void getAllocations().refresh();
});

const updateAllocation = form(updateAllocationSchema, async (data) => {
  const allocation = allocations.find((entry) => entry.id === data.id);
  if (allocation) {
    allocation.employee = data.employee;
    allocation.months = foldMonths(data.months);
  }
  void getAllocations().refresh();
});

export { createAllocation, getAllocations, updateAllocation };
export type { Allocation };
