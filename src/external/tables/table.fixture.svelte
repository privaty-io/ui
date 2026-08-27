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
    added?: string;
  }

  interface Props {
    rows: Item[];
    controller?: TableController;
    createForm?: Omit<RemoteForm<RemoteFormInput, unknown>, "for">;
    editForm?: RemoteForm<RemoteFormInput, unknown>;
    withCustomActions?: boolean;
    withExpanded?: boolean;
    withPinnedPrice?: boolean;
    withPinnedPriceRight?: boolean;
    withDateColumn?: boolean;
    withCustomCompare?: boolean;
    containerClass?: string;
    density?: "comfortable" | "compact";
    ondelete?: (row: Item) => unknown;
  }

  const {
    rows,
    controller,
    createForm,
    editForm,
    withCustomActions = false,
    withExpanded = false,
    withPinnedPrice = false,
    withPinnedPriceRight = false,
    withDateColumn = false,
    withCustomCompare = false,
    containerClass,
    density,
    ondelete,
  }: Props = $props();
</script>

{#snippet rowDetails({ row }: { row: Item })}
  <div>Details for {row.name}</div>
{/snippet}

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
  expanded={withExpanded ? rowDetails : undefined}
  class={containerClass}
  {density}
  {ondelete}
>
  <Column
    key="name"
    label="Name"
    value={(row: Item) => row.name}
    sortable
    compare={withCustomCompare
      ? (a: Item, b: Item) => a.price - b.price
      : undefined}
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
    key="price"
    label="Price"
    value={(row: Item) => row.price}
    sortable
    pin={withPinnedPriceRight ? "right" : withPinnedPrice ? "left" : undefined}
    width={withPinnedPrice || withPinnedPriceRight ? "8rem" : undefined}
  >
    {#snippet cell({ value })}
      {value} kr
    {/snippet}
  </Column>
  {#if withDateColumn}
    <Column
      key="added"
      label="Added"
      sortable
      value={(row: Item) => (row.added ? new Date(row.added) : null)}
    />
  {/if}
</Table>
