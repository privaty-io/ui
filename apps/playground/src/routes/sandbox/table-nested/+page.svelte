<script lang="ts">
  // Nested-table repro bench: expanded rows host a second, editable table
  // of records connected to the parent row — real remote forms throughout.
  import TextInput from "@privaty/ui-forms/inputs/text-input.svelte";
  import Column from "@privaty/ui-tables/column.svelte";
  import Table from "@privaty/ui-tables/table.svelte";
  import {
    createChild,
    getParents,
    updateChild,
    updateParent,
    type Child,
    type Parent,
  } from "./data.remote";
  import {
    createChildSchema,
    updateChildSchema,
    updateParentSchema,
  } from "./schema";

  const parentsQuery = getParents();
</script>

<main class="mx-auto flex w-full max-w-2xl flex-col gap-4 py-8">
  <h1 class="text-2xl font-medium">Nested tables (editing bench)</h1>

  <div class="h-96">
    <Table
      rows={parentsQuery}
      rowKey={(row) => row.id}
      expanded={rowDetails}
      editForm={updateParent}
      editSchema={updateParentSchema}
    >
      <Column key="name" label="Name" value={(row: Parent) => row.name}>
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
    </Table>
  </div>
</main>

{#snippet rowDetails({ row }: { row: Parent })}
  <div class="p-2" data-testid="nested-{row.id}">
    <Table
      rows={row.children}
      rowKey={(child) => child.id}
      createForm={createChild}
      createSchema={createChildSchema}
      editForm={updateChild}
      editSchema={updateChildSchema}
      hiddenFields={[{ key: "parentId", value: row.id }]}
    >
      <Column key="label" label="Label" value={(child: Child) => child.label}>
        {#snippet editor({ field, row: child })}
          <TextInput
            {field}
            label="Label"
            labelStyle="hidden"
            initialValue={child?.label ?? ""}
            required
          />
        {/snippet}
      </Column>
    </Table>
  </div>
{/snippet}
