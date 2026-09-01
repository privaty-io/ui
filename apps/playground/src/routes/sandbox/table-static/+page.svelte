<script lang="ts">
  // Minimal hydration repro bench: a static array, no loading, no editing,
  // no async — the shape of the work app's failing case.
  import Column from "@privaty/ui-tables/column.svelte";
  import Table from "@privaty/ui-tables/table.svelte";

  interface Item {
    id: string;
    name: string;
    price: number;
  }

  const rows: Item[] = [
    { id: "r1", name: "Comté", price: 89 },
    { id: "r2", name: "Rioja", price: 129 },
    { id: "r3", name: "Baguette", price: 24 },
  ];
</script>

<main class="mx-auto flex w-full max-w-2xl flex-col gap-4 py-8">
  <h1 class="text-2xl font-medium">Static table (hydration bench)</h1>

  <div class="h-64">
    <Table {rows} rowKey={(row) => row.id}>
      <Column
        key="name"
        label="Name"
        value={(row: Item) => row.name}
        sortable
      />
      <Column key="price" label="Price" value={(row: Item) => row.price} />
    </Table>
  </div>
</main>
