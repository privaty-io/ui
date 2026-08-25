<script lang="ts">
  import NumberInput from "#privaty/ui-forms/inputs/number-input.svelte";
  import TextInput from "#privaty/ui-forms/inputs/text-input.svelte";
  import Column from "#privaty/ui-tables/column.svelte";
  import { TableController } from "#privaty/ui-tables/table-controller.svelte.js";
  import Table from "#privaty/ui-tables/table.svelte";
  import Button from "#privaty/ui/components/button.svelte";
  import { createRow, deleteRow, getRows, updateRow } from "./data.remote";
  import { createRowSchema, updateRowSchema } from "./schema";

  interface Item {
    id: string;
    name: string;
    price: number;
  }

  const controller = new TableController();

  let density = $state<"comfortable" | "compact">("comfortable");

  // Awaiting the query is what makes the rows server-render (`.current` is
  // hard-coded to undefined on the server), and Kit pins awaited queries so
  // single-flight refreshes land. Crucially there is NO pending boundary
  // around this: a <svelte:boundary> with a `pending` snippet makes the
  // server render the snippet INSTEAD of the children — deferring the whole
  // subtree to the client. Kit's root supplies the error boundary and its
  // navigation handles the in-flight state.
  const rows = $derived(await getRows());
</script>

<main class="mx-auto flex w-full max-w-2xl flex-col gap-4 py-8">
  <h1 class="text-2xl font-medium">Table sandbox</h1>

  <p class="text-sm text-stone-600 dark:text-stone-400">
    The real <code>#privaty/ui-tables</code> components: declarative columns, tri-state
    sort, single active editor, and a controller that triggers the editors from anywhere
    — the buttons below live outside the table.
  </p>

  <div class="flex gap-2">
    <Button type="button" onclick={() => controller.startCreate()}>
      New row
    </Button>
    <Button
      variant="secondary"
      type="button"
      onclick={() => controller.startEdit("r2")}
    >
      Edit “Rioja” from outside
    </Button>
    <Button
      variant="secondary"
      type="button"
      onclick={() =>
        (density = density === "compact" ? "comfortable" : "compact")}
    >
      Density: {density}
    </Button>
  </div>

  <!-- Fixed-height container: the table fills it — data rows first, the
       filler row absorbing the rest. -->
  <div class="h-96">
    <Table
      {rows}
      rowKey={(row) => row.id}
      {controller}
      createForm={createRow}
      createSchema={createRowSchema}
      editForm={updateRow}
      editSchema={updateRowSchema}
      onDelete={(row) => deleteRow(row.id)}
      {density}
    >
      {#snippet expanded({ row })}
        <div class="flex flex-col gap-1 p-2 text-sm">
          <span class="font-medium">{row.name}</span>
          <span>Price: {row.price} kr</span>
          <span class="text-stone-500">Id: {row.id}</span>
        </div>
      {/snippet}
      <Column
        key="name"
        label="Name"
        value={(row: Item) => row.name}
        sortable
        pin="left"
        width="10rem"
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
      <!-- The tooltip accessor keeps the hover text in sync with the custom
           cell formatting (default would be the raw "129"). -->
      <Column
        key="price"
        label="Price"
        value={(row: Item) => row.price}
        tooltip={(row: Item) => `${row.price} kr`}
        sortable
      >
        {#snippet cell({ value })}
          {value} kr
        {/snippet}
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
      <!-- Wide display-only columns to force horizontal scroll — Name stays
           pinned left, the actions column pinned right. -->
      <Column
        key="vat"
        label="Price incl. VAT"
        value={(row: Item) => `${(row.price * 1.25).toFixed(2)} kr`}
        width="14rem"
      />
      <!-- Narrow on purpose: overflowing content truncates and shows the
           full text as a tooltip. -->
      <Column
        key="loud"
        label="Shouty name"
        value={(row: Item) => row.name.toUpperCase()}
        width="6rem"
      />
      <Column key="id" label="Id" value={(row: Item) => row.id} width="14rem" />
    </Table>
  </div>

  <ol
    class="list-decimal space-y-1 pl-5 text-sm text-stone-600 dark:text-stone-400"
  >
    <li>Sort: click Name/Price headers — ascending, descending, off.</li>
    <li>
      "New row" pins an empty editor at the top; Add appends and refreshes the
      table; Cancel closes; re-opening comes back empty.
    </li>
    <li>
      Edit via the row button AND via "Edit Rioja from outside"; fields seed
      from the row, Save is disabled until something changes.
    </li>
    <li>
      Cancel after typing, re-enter — no stale draft. Switch editors directly —
      previous draft drops.
    </li>
    <li>
      Save a valid edit — row updates in place, editor closes. Non-editable
      rendering (the "kr" suffix) survives inside the edit row.
    </li>
    <li>
      New in this round: the table fills its fixed-height container (filler
      region below the rows); the actions header hosts the + button (disabled
      while creating); all row/editor actions are icon buttons with tooltips;
      chevrons expand rows to nested content — several at once, independent of
      editing.
    </li>
    <li>
      Newest: the table scrolls inside its container; scroll right — Name stays
      pinned left, actions pinned right; add rows until it scrolls vertically —
      the header stays put; the actions column shrinks to its content.
    </li>
  </ol>
</main>
