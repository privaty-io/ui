<script lang="ts">
  import Button from "#privaty/ui/components/button.svelte";
  import NumberInput from "#privaty/ui-forms/inputs/number-input.svelte";
  import TextInput from "#privaty/ui-forms/inputs/text-input.svelte";
  import Column from "#privaty/ui-tables/column.svelte";
  import Table from "#privaty/ui-tables/table.svelte";
  import { TableController } from "#privaty/ui-tables/table-controller.svelte.js";
  import { createRow, getRows, updateRow } from "./data.remote";
  import { createRowSchema, updateRowSchema } from "./schema";

  interface Item {
    id: string;
    name: string;
    price: number;
  }

  const controller = new TableController();

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
  </div>

  <Table
    {rows}
    rowKey={(row) => row.id}
    {controller}
    createForm={createRow}
    createSchema={createRowSchema}
    editForm={updateRow}
    editSchema={updateRowSchema}
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
  </Table>

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
  </ol>
</main>
