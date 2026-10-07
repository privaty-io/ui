<script lang="ts">
  // Filtering + server sorting end to end: ONE queryValue shared by the
  // FilterBar (owns `where`) and the Table (owns `orderBy`), fed to a
  // remote query that validates with def.schema and executes through a
  // hand-rolled array converter. The Supplier column sorts by the
  // JOINED supplier name via sortField="supplierName".
  import type { AnyQueryInput } from "@privaty/query";
  import {
    Column,
    FilterBar,
    Table,
    type FilterPreset,
  } from "@privaty/ui-tables";

  import { getProducts, type Product } from "./data.remote";
  import { productQuery } from "./query";

  let queryValue = $state<AnyQueryInput | undefined>(undefined);

  const presets: FilterPreset<(typeof productQuery)["fields"]>[] = [
    { key: "hidden", label: "Show hidden", off: { hidden: { eq: false } } },
    {
      type: "select",
      key: "category",
      label: "Category",
      options: [
        { value: "all", label: "All categories" },
        {
          value: "cheese",
          label: "Cheese",
          where: { category: { eq: "cheese" } },
        },
        { value: "wine", label: "Wine", where: { category: { eq: "wine" } } },
        {
          value: "bread",
          label: "Bread",
          where: { category: { eq: "bread" } },
        },
      ],
    },
  ];

  // Held in a $derived so the per-input query instance stays pinned
  // (the .current pinning rule) — each new input shows the veil.
  const rowsQuery = $derived(getProducts(queryValue ?? {}));
</script>

<svelte:head>
  <title>Filtered table — sandbox</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-3xl flex-col gap-4 py-8">
  <div>
    <h1 class="text-2xl font-medium">Filtered table</h1>
    <p class="max-w-prose text-sm text-stone-600 dark:text-stone-400">
      The FilterBar edits the wire format, the headers emit server sorting into
      the same value, and the server validates everything with the definition's
      own schema. Supplier sorts by the joined name.
    </p>
  </div>

  <FilterBar
    query={productQuery}
    bind:value={queryValue}
    labels={{
      name: "Name",
      price: "Price",
      category: "Category",
      hidden: "Hidden",
      supplierName: "Supplier",
    }}
    {presets}
    search={{ field: "name", placeholder: "Search products…" }}
  />

  <div class="h-96">
    <Table
      rows={rowsQuery}
      rowKey={(row) => row.id}
      query={productQuery}
      bind:queryValue
    >
      <Column
        key="name"
        label="Name"
        sortable
        value={(row: Product) => row.name}
      />
      <Column
        key="price"
        label="Price"
        sortable
        value={(row: Product) => row.price ?? "—"}
      />
      <Column
        key="category"
        label="Category"
        value={(row: Product) => row.category}
      />
      <Column
        key="supplier"
        label="Supplier"
        sortable
        sortField="supplierName"
        value={(row: Product) => row.supplierId}
        tooltip={(row: Product) => row.supplierId}
        cell={supplierCell}
      />
    </Table>
  </div>
</main>

{#snippet supplierCell({ row }: { row: Product; value: unknown })}
  {row.supplierId === "s1"
    ? "Fromagerie Petit"
    : row.supplierId === "s2"
      ? "Bodega Ríos"
      : "Boulangerie Nord"}
{/snippet}
