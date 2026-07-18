<script lang="ts">
  import Button from "@privaty/ui/components/button.svelte";
  import FormError from "@privaty/ui-forms/components/form-error.svelte";
  import Submit from "@privaty/ui-forms/components/submit.svelte";
  import Form from "@privaty/ui-forms/form.svelte";
  import TextInput from "@privaty/ui-forms/inputs/text-input.svelte";
  import { createItem, getItems } from "./data.remote";
  import { createItemSchema } from "./schema";
</script>

<main class="mx-auto flex w-full max-w-md flex-col gap-8 py-8">
  <h1 class="text-2xl font-medium">Form sandbox</h1>

  <Form form={createItem} schema={createItemSchema}>
    <TextInput field={createItem.fields.name} label="Name" required />
    <TextInput
      field={createItem.fields.description}
      label="Description"
      labelStyle="floating"
    />

    <FormError />

    <div class="flex gap-2">
      <Submit label="Create" submittingLabel="Creating" />
      <Button
        type="reset"
        class="border border-stone-400 bg-transparent text-inherit hover:bg-stone-200/50 active:bg-transparent dark:border-stone-600 dark:bg-transparent dark:text-inherit dark:hover:bg-stone-800/50 dark:active:bg-transparent"
      >
        Reset
      </Button>
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
