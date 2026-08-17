<script lang="ts">
  import TextInput from "#privaty/ui-forms/inputs/text-input.svelte";
  import type { RemoteForm, RemoteFormInput } from "$app/server";
  import Column from "./column.svelte";
  import Table from "./table.svelte";
  import type { TableController } from "./table-controller.svelte";

  interface Item {
    id: string;
    name: string;
    price: number;
  }

  interface Props {
    rows: Item[];
    controller?: TableController;
    createForm?: Omit<RemoteForm<RemoteFormInput, unknown>, "for">;
    editForm?: RemoteForm<RemoteFormInput, unknown>;
    withCustomActions?: boolean;
  }

  const {
    rows,
    controller,
    createForm,
    editForm,
    withCustomActions = false,
  }: Props = $props();
</script>

{#snippet zapActions({ row }: { row: Item; controller: TableController })}
  <button type="button">Zap {row.name}</button>
{/snippet}

<Table
  {rows}
  rowKey={(row) => row.id}
  {controller}
  {createForm}
  {editForm}
  actions={withCustomActions ? zapActions : undefined}
>
  <Column key="name" label="Name" value={(row: Item) => row.name} sortable>
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
  <Column key="price" label="Price" value={(row: Item) => row.price} sortable>
    {#snippet cell({ value })}
      {value} kr
    {/snippet}
  </Column>
</Table>
