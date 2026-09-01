<script lang="ts">
  import NumberInput from "@privaty/ui-forms/inputs/number-input.svelte";
  import TextInput from "@privaty/ui-forms/inputs/text-input.svelte";
  import Column from "@privaty/ui-tables/column.svelte";
  import { TableController } from "@privaty/ui-tables/table-controller.svelte.js";
  import Table from "@privaty/ui-tables/table.svelte";
  import Button from "@privaty/ui/components/button.svelte";
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
  // The query object is held separately from the awaited rows: `.loading`
  // flips true on every refresh (single-flight included) and drives the
  // table's loading veil.
  // The calendar shape: years spanning generated quarter columns. Display
  // values derive deterministically from the price so edits ripple through.
  // Declared BEFORE the awaited query on purpose: under async SSR the
  // Table's children snippet can run before the script lines after the
  // await settle, and an {#each} over a then-undefined array silently
  // renders nothing server-side (the columns never register).
  const years = [2025, 2026, 2027];
  const quarters = years.flatMap((year) =>
    [1, 2, 3, 4].map((quarter) => ({
      key: `${year}-q${quarter}`,
      year: String(year),
      label: `Q${quarter}`,
      factor: (year - 2024) * 4 + quarter,
    })),
  );

  const rowsQuery = getRows();
  const rows = $derived(await rowsQuery);
</script>

<main class="mx-auto flex w-full max-w-4xl flex-col gap-4 py-8">
  <h1 class="text-2xl font-medium">Table sandbox</h1>

  <p class="text-sm text-stone-600 dark:text-stone-400">
    The real <code>@privaty/ui-tables</code> components: declarative columns, tri-state
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
    <Button
      variant="secondary"
      type="button"
      onclick={() =>
        controller.scrollToColumn("2026-q1", { behavior: "smooth" })}
    >
      Jump to 2026
    </Button>
    <Button
      variant="secondary"
      type="button"
      onclick={() => controller.scrollToColumn("id", { behavior: "smooth" })}
    >
      Jump to Id
    </Button>
  </div>

  <!-- Fixed-height container: the table fills it — data rows first, the
       filler row absorbing the rest. -->
  <div class="h-128">
    <Table
      {rows}
      loading={rowsQuery.loading}
      initialColumn="2025-q1"
      rowKey={(row) => row.id}
      {controller}
      createForm={createRow}
      createSchema={createRowSchema}
      editForm={updateRow}
      editSchema={updateRowSchema}
      ondelete={(row) => deleteRow(row.id)}
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
      <!-- The calendar shape: generated columns, each year spanning its
           quarters in the group header row. -->
      {#each quarters as quarter (quarter.key)}
        <Column
          key={quarter.key}
          group={quarter.year}
          label={quarter.label}
          value={(row: Item) => `${row.price * quarter.factor} kr`}
          width="6rem"
        />
      {/each}
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
    <li>
      Initial scroll: the table mounts with 2025's Q1 right after the pinned
      Name column (initialColumn="2025-q1") — even as fonts and data settle.
      "Jump to 2026" / "Jump to Id" smooth-scroll via controller.scrollToColumn.
      Open an editor after scrolling manually — the position survives, no
      re-jump.
    </li>
    <li>
      Column groups: each year spans its four quarters in the extra header row;
      scroll right and the year label sticks just after the pinned edge (keeping
      its padding gap) until the next year pushes it out; every save/delete
      flashes the loading veil.
    </li>
  </ol>
</main>
