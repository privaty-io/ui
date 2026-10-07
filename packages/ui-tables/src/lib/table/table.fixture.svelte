<script lang="ts">
  import type { Snippet } from "svelte";
  import { TextInput } from "@privaty/ui-forms";
  import type { RemoteForm, RemoteFormInput } from "$app/server";
  import Column from "../column.svelte";
  import Table from "./table.svelte";
  import type { TableController } from "../table-controller/table-controller.svelte";
  import type { RowsSource } from "../types";
  import { defineQuery, equality, field } from "@privaty/query";
  import type { AnyQueryInput } from "@privaty/query";
  import * as v from "valibot";

  interface Item {
    id: string;
    name: string;
    price: number;
    added?: string;
  }

  interface Props {
    rows: Item[] | RowsSource<Item>;
    controller?: TableController;
    createForm?: RemoteForm<RemoteFormInput, unknown>;
    editForm?: RemoteForm<RemoteFormInput, unknown>;
    withCustomActions?: boolean;
    withComposedActions?: boolean;
    withExpanded?: boolean;
    withSummary?: boolean;
    withPinnedPrice?: boolean;
    withPinnedPriceRight?: boolean;
    withDateColumn?: boolean;
    withCustomCompare?: boolean;
    containerClass?: string;
    withFlexParent?: boolean;
    loading?: boolean;
    withGroups?: boolean;
    initialColumn?: string;
    withQuarterColumns?: boolean;
    density?: "comfortable" | "compact";
    ondelete?: (row: Item) => unknown;
    onsuccess?: (context: {
      mode: "create" | "edit";
      rowId?: string | number;
      result: unknown;
    }) => unknown;
    onerror?: (context: {
      mode: "create" | "edit";
      rowId?: string | number;
      error: unknown;
    }) => unknown;
    withQuery?: boolean;
    queryValue?: AnyQueryInput;
  }

  // Server-sort rig: the name COLUMN sorts by the supplierName FIELD
  // (the joined-column case); price has no def field on purpose.
  const sampleQuery = defineQuery({
    supplierName: field({ kind: "string", schema: v.string(), ops: equality }),
  });

  let {
    rows,
    controller,
    createForm,
    editForm,
    withCustomActions = false,
    withComposedActions = false,
    withExpanded = false,
    withSummary = false,
    withPinnedPrice = false,
    withPinnedPriceRight = false,
    withDateColumn = false,
    withCustomCompare = false,
    containerClass,
    withFlexParent = false,
    loading = false,
    withGroups = false,
    initialColumn,
    withQuarterColumns = false,
    density,
    ondelete,
    onsuccess,
    onerror,
    withQuery = false,
    queryValue = $bindable(undefined),
  }: Props = $props();

  export function currentQueryValue() {
    return queryValue;
  }
</script>

{#snippet rowDetails({ row }: { row: Item })}
  <div>Details for {row.name}</div>
{/snippet}

{#snippet zapActions({ row }: { row: Item; controller: TableController })}
  <button type="button">Zap {row.name}</button>
{/snippet}

{#snippet composedActions({
  row,
  defaults,
}: {
  row: Item;
  controller: TableController;
  defaults: Snippet;
})}
  <!-- Ordering is the consumer's: leading custom, built-ins, trailing
       custom. -->
  <div class="flex gap-1">
    <button type="button">Copy {row.name}</button>
    {@render defaults()}
    <button type="button">More</button>
  </div>
{/snippet}

{#snippet theTable()}
  <Table
    {rows}
    rowKey={(row) => row.id}
    {controller}
    {createForm}
    {editForm}
    actions={withComposedActions
      ? composedActions
      : withCustomActions
        ? zapActions
        : undefined}
    expanded={withExpanded ? rowDetails : undefined}
    class={containerClass}
    {loading}
    {initialColumn}
    {density}
    {ondelete}
    {onsuccess}
    {onerror}
    query={withQuery ? sampleQuery : undefined}
    bind:queryValue
  >
    <Column
      key="name"
      label="Name"
      group={withGroups ? "Product" : undefined}
      value={(row: Item) => row.name}
      sortable
      sortField="supplierName"
      compare={withCustomCompare
        ? (a: Item, b: Item) => a.price - b.price
        : undefined}
      summary={withSummary ? nameSummary : undefined}
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
      pin={withPinnedPriceRight
        ? "right"
        : withPinnedPrice
          ? "left"
          : undefined}
      width={withPinnedPrice || withPinnedPriceRight ? "8rem" : undefined}
      summary={withSummary ? priceSummary : undefined}
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
{/snippet}

{#if withFlexParent}
  <!-- The work-app shape: a flex column with a title, the table bounded
       ONLY by the leftover flex space — no explicit height anywhere on
       the table itself. -->
  <div class="flex h-64 flex-col" data-testid="flex-parent">
    <p class="shrink-0 py-2">Products</p>
    {@render theTable()}
  </div>
{:else}
  {@render theTable()}
{/if}

{#snippet nameSummary({ rows }: { rows: readonly Item[] })}
  <span data-testid="summary-label">Total ({rows.length} rows)</span>
{/snippet}

{#snippet priceSummary({ rows }: { rows: readonly Item[] })}
  <!-- Not a blind column sum: a computed value over the rows — the
       surplus-style flexibility the feature exists for. -->
  <span data-testid="summary-price">
    {rows.reduce((total, row) => total + row.price, 0) - 100}
  </span>
{/snippet}
