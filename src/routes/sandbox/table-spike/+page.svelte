<script lang="ts">
  import Button from "#privaty/ui/components/button.svelte";
  import FormError from "#privaty/ui-forms/components/form-error.svelte";
  import Reset from "#privaty/ui-forms/components/reset.svelte";
  import Submit from "#privaty/ui-forms/components/submit.svelte";
  import Form from "#privaty/ui-forms/form.svelte";
  import NumberInput from "#privaty/ui-forms/inputs/number-input.svelte";
  import TextInput from "#privaty/ui-forms/inputs/text-input.svelte";
  import { createRow, getRows, updateRow } from "./data.remote";
  import { createRowSchema, updateRowSchema } from "./schema";

  // The whole table sits inside ONE <Form>, swapped to whichever editor is
  // active — create row or a single edit row. Only the active editor's
  // controls exist in the DOM, so Kit's form-attached listeners see every
  // event natively and the ui-forms components work unchanged.
  type Editor =
    { type: "idle" } | { type: "create" } | { type: "edit"; rowId: string };

  let editor = $state<Editor>({ type: "idle" });

  // Hold the query proxy for the component's lifetime: a transient
  // `getRows().current` read leaves the proxy GC-eligible, and Kit evicts
  // the cache entry with it — server-initiated single-flight refreshes then
  // have no live resource to update and the table goes stale until a full
  // page load. (Kit pins entries on the await path, but not on `.current`.)
  const rowsQuery = getRows();
  const rows = $derived(rowsQuery.current ?? []);
  type Row = (typeof rows)[number];

  const editingRow = $derived.by(() => {
    const active = editor;
    return active.type === "edit"
      ? rows.find((row) => row.id === active.rowId)
      : undefined;
  });

  function close() {
    editor = { type: "idle" };
  }

  // Remote form instances are CACHED (`.for(key)` per key, and the unkeyed
  // create instance is a singleton), so entering an editor resurrects the
  // previous draft. Reseed every field on entry — before the editor mounts,
  // `set()` only writes the tracked value without marking touched/dirty.
  function startCreate() {
    createRow.fields.name.set("");
    createRow.fields.price.set(undefined as never);
    editor = { type: "create" };
  }

  function startEdit(rowId: string) {
    const row = rows.find((candidate) => candidate.id === rowId);
    if (!row) return;

    const instance = updateRow.for(rowId);
    instance.fields.id.set(rowId);
    instance.fields.name.set(row.name);
    instance.fields.price.set(row.price);

    editor = { type: "edit", rowId };
  }

  const debugDump = $derived(
    JSON.stringify(
      {
        editor,
        edit:
          editor.type === "edit"
            ? {
                pending: updateRow.for(editor.rowId).pending,
                name: {
                  value: updateRow.for(editor.rowId).fields.name.value(),
                  dirty: updateRow.for(editor.rowId).fields.name.dirty(),
                },
                price: {
                  value: updateRow.for(editor.rowId).fields.price.value(),
                  dirty: updateRow.for(editor.rowId).fields.price.dirty(),
                },
                issues: updateRow.for(editor.rowId).fields.allIssues(),
              }
            : undefined,
        create:
          editor.type === "create"
            ? {
                pending: createRow.pending,
                name: {
                  value: createRow.fields.name.value(),
                  dirty: createRow.fields.name.dirty(),
                },
                issues: createRow.fields.allIssues(),
              }
            : undefined,
      },
      (_, value: unknown) => (value === undefined ? "∅" : value),
      2,
    ),
  );

  const cellClasses =
    "border border-stone-300 px-3 py-1.5 dark:border-stone-700";
  const editorRowClasses = "bg-stone-100 align-top dark:bg-stone-900";
</script>

{#snippet displayRow(row: Row)}
  <tr>
    <td class={cellClasses}>{row.name}</td>
    <td class={cellClasses}>{row.price}</td>
    <td class={cellClasses}>
      <Button
        variant="secondary"
        type="button"
        class="text-sm"
        onclick={() => startEdit(row.id)}
      >
        Edit
      </Button>
    </td>
  </tr>
{/snippet}

{#snippet spikeTable()}
  <table class="w-full border-collapse text-left">
    <thead>
      <tr>
        <th class={cellClasses}>Name</th>
        <th class={cellClasses}>Price</th>
        <th class={cellClasses}>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#if editor.type === "create"}
        <tr class={editorRowClasses}>
          <td class={cellClasses}>
            <TextInput
              field={createRow.fields.name}
              label="Name"
              labelStyle="hidden"
              required
            />
          </td>
          <td class={cellClasses}>
            <NumberInput
              field={createRow.fields.price}
              label="Price"
              labelStyle="hidden"
              min={0}
              required
            />
          </td>
          <td class={cellClasses}>
            <div class="flex gap-1">
              <Submit label="Add" />
              <Button variant="secondary" type="button" onclick={close}>
                Cancel
              </Button>
            </div>
          </td>
        </tr>
      {/if}

      {#each rows as row (row.id)}
        {#if editor.type === "edit" && editor.rowId === row.id}
          <tr class={editorRowClasses}>
            <td class={cellClasses}>
              <!-- The row id rides along as a hidden input — with a wrapping
                   form any cell will do, no association tricks needed. -->
              <input
                {...updateRow.for(row.id).fields.id.as("hidden", row.id)}
              />
              <TextInput
                field={updateRow.for(row.id).fields.name}
                label="Name"
                labelStyle="hidden"
                initialValue={row.name}
                required
              />
            </td>
            <td class={cellClasses}>
              <NumberInput
                field={updateRow.for(row.id).fields.price}
                label="Price"
                labelStyle="hidden"
                initialValue={row.price}
                min={0}
                required
              />
            </td>
            <td class={cellClasses}>
              <div class="flex gap-1">
                <Submit label="Save" />
                <Reset />
                <Button variant="secondary" type="button" onclick={close}>
                  Cancel
                </Button>
              </div>
            </td>
          </tr>
        {:else}
          {@render displayRow(row)}
        {/if}
      {/each}
    </tbody>
  </table>

  {#if editor.type !== "idle"}
    <FormError />
  {/if}
{/snippet}

<main class="mx-auto flex w-full max-w-2xl flex-col gap-4 py-8">
  <h1 class="text-2xl font-medium">Table spike — wrapping form</h1>

  <p class="text-sm text-stone-600 dark:text-stone-400">
    One <code>&lt;Form&gt;</code> wraps the whole table and swaps to the active editor
    (create row or a single edit row). Both editors are triggered from OUTSIDE the
    table state — the buttons below stand in for "trigger creation from anywhere"
    and "go to this row and start editing".
  </p>

  <div class="flex gap-2">
    <Button
      type="button"
      onclick={startCreate}
      disabled={editor.type === "create"}
    >
      New row
    </Button>
    <Button variant="secondary" type="button" onclick={() => startEdit("r2")}>
      Edit “Rioja” from outside
    </Button>
  </div>

  {#if editor.type === "edit" && editingRow}
    {#key editor.rowId}
      <Form
        form={updateRow.for(editor.rowId)}
        schema={updateRowSchema}
        class="block"
        onsuccess={close}
      >
        {@render spikeTable()}
      </Form>
    {/key}
  {:else if editor.type === "create"}
    <Form
      form={createRow}
      schema={createRowSchema}
      class="block"
      onsuccess={close}
    >
      {@render spikeTable()}
    </Form>
  {:else}
    {@render spikeTable()}
  {/if}

  <pre
    class="overflow-x-auto rounded border border-stone-300 p-3 text-xs dark:border-stone-700">{debugDump}</pre>

  <ol
    class="list-decimal space-y-1 pl-5 text-sm text-stone-600 dark:text-stone-400"
  >
    <li>
      "New row" (external trigger) shows the pinned editor; empty Add is blocked
      with errors; valid Add appends the row and closes the editor.
    </li>
    <li>
      Enter edit via the row button AND via "Edit Rioja from outside" — the
      trigger-from-anywhere requirement.
    </li>
    <li>
      Edit fields seed from the row; Save stays disabled until something changes
      (dirty gating through the real FormState).
    </li>
    <li>Reset returns the editor to the seeded values.</li>
    <li>
      Cancel an edit after typing, re-enter the SAME row — the draft must NOT
      resurrect (instances are cached; triggers reseed on entry).
    </li>
    <li>
      Cancel create after typing, re-open create — must come back empty (same
      reseed-on-entry, unkeyed instance).
    </li>
    <li>
      Switch editors directly (row → other row, row → create): unsaved changes
      drop silently (v1 default) — and how does the remount feel?
    </li>
    <li>Save a valid edit — the row updates and the editor closes.</li>
  </ol>
</main>
