<script lang="ts">
  // Repro host: a table whose expanded rows contain a NESTED table with
  // its own editing forms — records connected to the parent row.
  import TextInput from "@privaty/ui-forms/inputs/text-input.svelte";
  import type { RemoteForm, RemoteFormInput } from "$app/server";
  import Column from "./column.svelte";
  import Table from "./table.svelte";

  interface Child {
    id: string;
    label: string;
  }

  interface Parent {
    id: string;
    name: string;
    children: Child[];
  }

  interface Props {
    rows: Parent[];
    outerCreateForm?: Omit<RemoteForm<RemoteFormInput, unknown>, "for">;
    outerEditForm?: RemoteForm<RemoteFormInput, unknown>;
    innerCreateForm?: Omit<RemoteForm<RemoteFormInput, unknown>, "for">;
    innerEditForm?: RemoteForm<RemoteFormInput, unknown>;
    innerHiddenFields?: { key: string; value: string | number }[];
  }

  const {
    rows,
    outerCreateForm,
    outerEditForm,
    innerCreateForm,
    innerEditForm,
    innerHiddenFields,
  }: Props = $props();
</script>

<div class="h-96">
  <Table
    {rows}
    rowKey={(row) => row.id}
    expanded={rowDetails}
    createForm={outerCreateForm}
    editForm={outerEditForm}
  >
    <Column key="name" label="Name" value={(row: Parent) => row.name}>
      {#snippet editor({ field, row })}
        <TextInput
          {field}
          label="Name"
          labelStyle="hidden"
          initialValue={row?.name ?? ""}
        />
      {/snippet}
    </Column>
  </Table>
</div>

{#snippet rowDetails({ row }: { row: Parent })}
  <div class="p-2" data-testid="nested-{row.id}">
    <Table
      rows={row.children}
      rowKey={(child) => child.id}
      createForm={innerCreateForm}
      editForm={innerEditForm}
      hiddenFields={innerHiddenFields}
    >
      <Column key="label" label="Label" value={(child: Child) => child.label}>
        {#snippet editor({ field, row: child })}
          <TextInput
            {field}
            label="Label"
            labelStyle="hidden"
            initialValue={child?.label ?? ""}
          />
        {/snippet}
      </Column>
    </Table>
  </div>
{/snippet}
