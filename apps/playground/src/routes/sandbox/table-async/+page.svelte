<script lang="ts">
  // Async-rows bench: the query takes 2s. Expected with `rows={query}`:
  // instant SSR shipping the veiled table, veil during client loads and
  // navigations, veil again on refresh — never a blocked response.
  import Button from "@privaty/ui/components/button.svelte";
  import Column from "@privaty/ui-tables/column.svelte";
  import Table from "@privaty/ui-tables/table.svelte";
  import { getSlowRows, type SlowItem } from "./data.remote";

  const rowsQuery = getSlowRows();
</script>

<main class="mx-auto flex w-full max-w-2xl flex-col gap-4 py-8">
  <h1 class="text-2xl font-medium">Async table (slow-query bench)</h1>

  <Button variant="secondary" onclick={() => rowsQuery.refresh()}>
    Refresh (2s)
  </Button>

  <div class="h-64">
    <Table rows={rowsQuery} rowKey={(row) => row.id}>
      <Column key="name" label="Name" value={(row: SlowItem) => row.name} />
      <Column key="price" label="Price" value={(row: SlowItem) => row.price} />
    </Table>
  </div>
</main>
