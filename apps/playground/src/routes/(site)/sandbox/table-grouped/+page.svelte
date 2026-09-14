<script lang="ts">
  // Grouped editor fields bench: the month columns fold into ONE "months"
  // array field, so a whole calendar row saves in a single editor pass —
  // no nested months table needed. A summary row computes the monthly
  // surplus/deficit against a fixed capacity (the FTE shape).
  import { NumberInput, TextInput } from "@privaty/ui-forms";
  import { Column, Table } from "@privaty/ui-tables";

  import {
    createAllocation,
    getAllocations,
    updateAllocation,
    type Allocation,
  } from "./data.remote";
  import {
    createAllocationSchema,
    MONTH_KEYS,
    updateAllocationSchema,
  } from "./schema";

  // Surplus = capacity minus allocation — NOT a plain column sum: the
  // summary row's whole point is computed content.
  const CAPACITY_PER_MONTH = 320;
</script>

<main class="mx-auto flex w-full max-w-4xl flex-col gap-4 py-8">
  <h1 class="text-2xl font-medium">Grouped editor fields (months array)</h1>

  <p class="text-sm text-stone-600 dark:text-stone-400">
    Every month column below folds into one <code>months</code> array field:
    editing a row edits all its months in a single save, and the handler
    receives the whole array. The footer computes each month's surplus against a {CAPACITY_PER_MONTH}h
    capacity.
  </p>

  <div class="h-96">
    <Table
      rows={getAllocations()}
      rowKey={(row) => row.id}
      createForm={createAllocation}
      createSchema={createAllocationSchema}
      editForm={updateAllocation}
      editSchema={updateAllocationSchema}
    >
      <Column
        key="employee"
        label="Employee"
        value={(row: Allocation) => row.employee}
        summary={employeeSummary}
      >
        {#snippet editor({ field, row })}
          <TextInput
            {field}
            label="Employee"
            labelStyle="hidden"
            initialValue={row?.employee ?? ""}
            required
          />
        {/snippet}
      </Column>
      {#each MONTH_KEYS as month (month)}
        <Column
          key={month}
          label={month}
          value={(row: Allocation) => row.months[month] ?? 0}
          editorGroup={{
            field: "months",
            key: month,
            keyName: "month",
            valueName: "hours",
          }}
          createSeed={0}
        >
          {#snippet editor({ field, row })}
            <NumberInput
              {field}
              label={month}
              labelStyle="hidden"
              initialValue={row?.months[month] ?? 0}
              min={0}
              required
            />
          {/snippet}
          {#snippet summary({ rows }: { rows: readonly Allocation[] })}
            {@const allocated = rows.reduce(
              (total, row) => total + (row.months[month] ?? 0),
              0,
            )}
            {@const surplus = CAPACITY_PER_MONTH - allocated}
            <span class={surplus < 0 ? "text-red-700 dark:text-red-500" : ""}>
              {surplus >= 0 ? "+" : ""}{surplus}h
            </span>
          {/snippet}
        </Column>
      {/each}
    </Table>
  </div>
</main>

{#snippet employeeSummary()}
  <span class="font-medium">Surplus</span>
{/snippet}
