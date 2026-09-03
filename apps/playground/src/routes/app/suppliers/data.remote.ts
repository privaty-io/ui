import { form, query } from "$app/server";
import { createSupplierSchema } from "./schema";

interface Supplier {
  id: string;
  name: string;
  email: string;
  region?: string;
  contractStart: string;
  billingMonth: string;
  deliveryWeek: string;
  notes?: string;
  organic: boolean;
}

const suppliers: Supplier[] = [
  {
    id: "sup-1",
    name: "Fromagerie Petit",
    email: "contact@petit.example",
    region: "france",
    contractStart: "2025-03-01",
    billingMonth: "2025-03",
    deliveryWeek: "2026-W02",
    organic: true,
  },
];

const getSuppliers = query(async () => suppliers);

const createSupplier = form(createSupplierSchema, async (data) => {
  suppliers.push({ id: crypto.randomUUID(), ...data });
  void getSuppliers().refresh();
});

export { createSupplier, getSuppliers };
export type { Supplier };
