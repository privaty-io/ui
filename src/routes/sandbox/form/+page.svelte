<script lang="ts">
  import Form from "@privaty/ui-forms/form.svelte";
  import { createItem, getItems } from "./data.remote";
  import { createItemSchema } from "./schema";
</script>

<main class="mx-auto flex w-full max-w-md flex-col gap-8 py-8">
  <h1 class="text-2xl font-medium">Form sandbox</h1>

  <Form form={createItem} schema={createItemSchema}>
    <label class="flex flex-col gap-1">
      Name
      <input
        class="rounded border border-stone-400 px-2 py-1"
        {...createItem.fields.name.as("text")}
      />
    </label>
    {#each createItem.fields.name.issues() ?? [] as issue (issue.message)}
      <p class="text-sm text-red-700 dark:text-red-500">{issue.message}</p>
    {/each}

    <label class="flex flex-col gap-1">
      Description
      <input
        class="rounded border border-stone-400 px-2 py-1"
        {...createItem.fields.description.as("text")}
      />
    </label>
    {#each createItem.fields.description.issues() ?? [] as issue (issue.message)}
      <p class="text-sm text-red-700 dark:text-red-500">{issue.message}</p>
    {/each}

    <div class="flex gap-2">
      <button
        class="cursor-pointer rounded bg-stone-800 px-3 py-1 text-stone-50 dark:bg-stone-200 dark:text-stone-900"
      >
        Create
      </button>
      <button type="reset" class="cursor-pointer rounded border px-3 py-1">
        Reset
      </button>
    </div>
  </Form>

  <svelte:boundary>
    <ul class="flex flex-col gap-1">
      {#each await getItems() as item (item.id)}
        <li>{item.name}{item.description ? ` — ${item.description}` : ""}</li>
      {:else}
        <li class="text-stone-500">No items yet.</li>
      {/each}
    </ul>

    {#snippet pending()}
      <p>Loading…</p>
    {/snippet}
  </svelte:boundary>
</main>
