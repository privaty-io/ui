import { query } from "$app/server";

interface SupplierSchedule {
  id: string;
  supplier: string;
  /** Cases delivered per quarter, keyed "YYYY-qN". */
  volumes: Record<string, number>;
}

const suppliers = [
  "Fromagerie Petit",
  "Bodega Ríos",
  "Boulangerie Nord",
  "Casa del Queso",
  "Vinhos do Douro",
  "Molkerei Alpen",
];

const years = [2025, 2026, 2027];

// Deterministic volumes: stable across reloads, unique per cell.
const schedule: SupplierSchedule[] = suppliers.map((supplier, row) => ({
  id: `sup-${row + 1}`,
  supplier,
  volumes: Object.fromEntries(
    years.flatMap((year) =>
      [1, 2, 3, 4].map((quarter) => [
        `${year}-q${quarter}`,
        40 + (((row * 7 + (year - 2025) * 4 + quarter) * 13) % 160),
      ]),
    ),
  ),
}));

const getSchedule = query(async () => {
  await new Promise<void>((resolve) => setTimeout(resolve, 120));
  return schedule;
});

export { getSchedule };
export type { SupplierSchedule };
