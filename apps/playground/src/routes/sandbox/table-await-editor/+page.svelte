<script lang="ts">
  // Minimal repro: ONE table, no nesting — an editor snippet that AWAITS
  // a not-yet-resolved options query while the editor opens.
  import { toSelectOptions } from "@privaty/ui";
  import SelectInput from "@privaty/ui-forms/inputs/select-input.svelte";
  import TextInput from "@privaty/ui-forms/inputs/text-input.svelte";
  import * as v from "valibot";
  import Column from "@privaty/ui-tables/column.svelte";
  import Table from "@privaty/ui-tables/table.svelte";
  import {
    getCategories,
    getItems,
    updateItem,
    type Item,
  } from "./data.remote";

  const updateItemSchema = v.object({
    id: v.pipe(v.string(), v.nonEmpty("required")),
    name: v.pipe(v.string(), v.nonEmpty("required")),
    categoryId: v.optional(v.string()),
  });
</script>

<main class="mx-auto flex w-full max-w-2xl flex-col gap-4 py-8">
  <h1 class="text-2xl font-medium">Awaited editor options (crash bench)</h1>

  <div class="h-64">
    <Table
      rows={getItems()}
      rowKey={(row) => row.id}
      editForm={updateItem}
      editSchema={updateItemSchema}
    >
      <Column key="name" label="Name" value={(row: Item) => row.name}>
        {#snippet editor({ field, row })}
          <TextInput
            {field}
            label="Name"
            labelStyle="hidden"
            initialValue={row?.name ?? ""}
            required
          />
        {/snippet}
      </Column>
      <Column
        key="categoryId"
        label="Category"
        value={(row: Item) => row.categoryId}
      >
        {#snippet editor({ field, row })}
          <SelectInput
            {field}
            label="Category"
            labelStyle="hidden"
            options={toSelectOptions(await getCategories(), {
              value: (category) => category.id,
              label: (category) => category.label,
            })}
            initialValue={row?.categoryId ?? ""}
            placeholder="No category"
          />
        {/snippet}
      </Column>
    </Table>
  </div>
</main>
