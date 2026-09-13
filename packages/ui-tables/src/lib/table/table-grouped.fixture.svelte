<script lang="ts">
  // Test host for editorGroup: a calendar-shaped allocations table whose
  // month columns fold into ONE "months" array field — every month of a
  // row saved in a single editor pass.
  import { NumberInput, TextInput } from "@privaty/ui-forms";

  import type { RemoteForm, RemoteFormInput } from "$app/server";
  import Column from "../column.svelte";
  import Table from "./table.svelte";

  interface Allocation {
    id: string;
    employee: string;
    /** Hours per ISO month. */
    months: Record<string, number>;
  }

  interface Props {
    rows: Allocation[];
    createForm?: RemoteForm<RemoteFormInput, unknown>;
    editForm?: RemoteForm<RemoteFormInput, unknown>;
  }

  const { rows, createForm, editForm }: Props = $props();

  const months = ["2026-01", "2026-02"];
</script>

<Table {rows} rowKey={(row) => row.id} {createForm} {editForm}>
  <Column
    key="employee"
    label="Employee"
    value={(row: Allocation) => row.employee}
  >
    {#snippet editor({ field, row })}
      <TextInput
        {field}
        label="Employee"
        labelStyle="hidden"
        initialValue={row?.employee ?? ""}
      />
    {/snippet}
  </Column>
  {#each months as month (month)}
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
        />
      {/snippet}
    </Column>
  {/each}
</Table>
