<script lang="ts">
  import TextInput from "@privaty/ui-forms/inputs/text-input.svelte";
  import type { RemoteForm, RemoteFormInput } from "$app/server";
  import Column from "./column.svelte";
  import Table from "./table.svelte";
  import type { TableController } from "./table-controller.svelte";
  import type { RowsSource } from "./types";

  interface Item {
    id: string;
    name: string;
    price: number;
    added?: string;
  }

  interface Props {
    rows: Item[] | RowsSource<Item>;
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
    loading?: boolean;
    withGroups?: boolean;
    initialColumn?: string;
    withQuarterColumns?: boolean;
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
    loading = false,
    withGroups = false,
    initialColumn,
    withQuarterColumns = false,
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
  {loading}
  {initialColumn}
  {density}
  {ondelete}
>
  <Column
    key="name"
    label="Name"
    group={withGroups ? "Product" : undefined}
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
    group={withGroups ? "Product" : undefined}
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
  {#if withQuarterColumns}
    {#each [2025, 2026, 2027] as year (year)}
      {#each [1, 2, 3, 4] as quarter (quarter)}
        <Column
          key={`${year}-q${quarter}`}
          group={String(year)}
          label={`Q${quarter}`}
          value={(row: Item) => row.price * quarter}
          width="6rem"
        />
      {/each}
    {/each}
  {/if}
</Table>
