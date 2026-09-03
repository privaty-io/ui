<script lang="ts">
  // Inventory: the state-stress centerpiece — a rows-SOURCE table (SSR
  // ships the loading state, the client fills in), inline editing with
  // remote select options awaited IN the editor, a date picker editor,
  // and nested batch tables in expanded rows linked via hiddenFields.
  import { toSelectOptions } from "@privaty/ui";
  import Button from "@privaty/ui/components/button.svelte";
  import DatePickerInput from "@privaty/ui-forms/inputs/date-picker-input.svelte";
  import NumberInput from "@privaty/ui-forms/inputs/number-input.svelte";
  import SelectInput from "@privaty/ui-forms/inputs/select-input.svelte";
  import TextInput from "@privaty/ui-forms/inputs/text-input.svelte";
  import Column from "@privaty/ui-tables/column.svelte";
  import { TableController } from "@privaty/ui-tables/table-controller.svelte.js";
  import Table from "@privaty/ui-tables/table.svelte";
  import {
    createBatch,
    createProduct,
    deleteProduct,
    getBatches,
    getCategoryOptions,
    getProducts,
    updateBatch,
    updateProduct,
    type Batch,
    type Product,
  } from "./data.remote";
  import {
    createBatchSchema,
    createProductSchema,
    updateBatchSchema,
    updateProductSchema,
  } from "./schema";

  const controller = new TableController();
  const productsQuery = getProducts();
  const categoriesQuery = getCategoryOptions();

  const categoryLabel = (categoryId: string | undefined) =>
    (categoriesQuery.current ?? []).find((entry) => entry.id === categoryId)
      ?.label ?? "—";
</script>

<main class="flex flex-col gap-4">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-medium">Inventory</h1>
    <div class="flex gap-2">
      <Button
        variant="secondary"
        type="button"
        onclick={() => productsQuery.refresh()}
      >
        Refresh
      </Button>
      <Button type="button" onclick={() => controller.startCreate()}>
        New product
      </Button>
    </div>
  </div>

  <div class="h-112">
    <Table
      rows={productsQuery}
      rowKey={(row) => row.id}
      {controller}
      createForm={createProduct}
      createSchema={createProductSchema}
      editForm={updateProduct}
      editSchema={updateProductSchema}
      ondelete={(row) => deleteProduct(row.id)}
      expanded={batchesFor}
    >
      <Column
        key="name"
        label="Name"
        value={(row: Product) => row.name}
        sortable
      >
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
        value={(row: Product) => row.categoryId ?? ""}
      >
        {#snippet cell({ row })}
          {categoryLabel((row as Product).categoryId)}
        {/snippet}
        {#snippet editor({ field, row })}
          <!-- Awaited remote options + a clearable optional select: the
               cell shows a pending spinner until the options land, and
               "No category" is a real choice. -->
          <SelectInput
            {field}
            label="Category"
            labelStyle="hidden"
            options={toSelectOptions(await categoriesQuery, {
              value: (category) => category.id,
              label: (category) => category.label,
            })}
            initialValue={row?.categoryId ?? ""}
            placeholder="No category"
          />
        {/snippet}
      </Column>
      <Column
        key="price"
        label="Price"
        value={(row: Product) => row.price}
        sortable
      >
        {#snippet editor({ field, row })}
          <NumberInput
            {field}
            label="Price"
            labelStyle="hidden"
            initialValue={row?.price}
            min={0}
            required
          />
        {/snippet}
      </Column>
      <Column
        key="stock"
        label="Stock"
        value={(row: Product) => row.stock}
        sortable
      >
        {#snippet editor({ field, row })}
          <NumberInput
            {field}
            label="Stock"
            labelStyle="hidden"
            initialValue={row?.stock}
            min={0}
            required
          />
        {/snippet}
      </Column>
      <Column
        key="restocked"
        label="Restocked"
        value={(row: Product) => row.restocked}
      >
        {#snippet editor({ field, row })}
          <DatePickerInput
            {field}
            label="Restocked"
            labelStyle="hidden"
            initialValue={row?.restocked ?? ""}
            required
          />
        {/snippet}
      </Column>
    </Table>
  </div>
</main>

{#snippet batchesFor({ row }: { row: Product })}
  <div class="flex flex-col gap-2 p-3" data-testid="batches-{row.id}">
    <h2 class="text-sm font-medium">Batches — {row.name}</h2>
    <Table
      rows={getBatches(row.id)}
      rowKey={(batch) => batch.id}
      createForm={createBatch}
      createSchema={createBatchSchema}
      editForm={updateBatch}
      editSchema={updateBatchSchema}
      hiddenFields={[{ key: "productId", value: row.id }]}
    >
      <Column key="code" label="Code" value={(batch: Batch) => batch.code}>
        {#snippet editor({ field, row: batch })}
          <TextInput
            {field}
            label="Code"
            labelStyle="hidden"
            initialValue={batch?.code ?? ""}
            required
          />
        {/snippet}
      </Column>
      <Column key="size" label="Size" value={(batch: Batch) => batch.size}>
        {#snippet editor({ field, row: batch })}
          <NumberInput
            {field}
            label="Size"
            labelStyle="hidden"
            initialValue={batch?.size}
            min={1}
            required
          />
        {/snippet}
      </Column>
    </Table>
  </div>
{/snippet}
