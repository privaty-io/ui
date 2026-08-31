<script lang="ts">
  import FormError from "@privaty/ui-forms/components/form-error.svelte";
  import Reset from "@privaty/ui-forms/components/reset.svelte";
  import Submit from "@privaty/ui-forms/components/submit.svelte";
  import CheckboxInput from "@privaty/ui-forms/inputs/checkbox-input.svelte";
  import DatePickerInput from "@privaty/ui-forms/inputs/date-picker-input.svelte";
  import Form from "@privaty/ui-forms/form.svelte";
  import MonthPickerInput from "@privaty/ui-forms/inputs/month-picker-input.svelte";
  import NumberInput from "@privaty/ui-forms/inputs/number-input.svelte";
  import SelectInput from "@privaty/ui-forms/inputs/select-input.svelte";
  import TextInput from "@privaty/ui-forms/inputs/text-input.svelte";
  import TextareaInput from "@privaty/ui-forms/inputs/textarea-input.svelte";
  import { createItem, getItems } from "./data.remote";
  import { categories, createItemSchema } from "./schema";
</script>

<main class="mx-auto flex w-full max-w-md flex-col gap-8 py-8">
  <h1 class="text-2xl font-medium">Form sandbox</h1>

  <Form form={createItem} schema={createItemSchema}>
    <TextInput field={createItem.fields.name} label="Name" required />
    <TextareaInput
      field={createItem.fields.description}
      label="Description"
      rows={3}
    />
    <NumberInput field={createItem.fields.price} label="Price" min={0} />
    <SelectInput
      field={createItem.fields.category}
      label="Category"
      options={categories}
      placeholder="Choose a category"
      required
    />
    <!-- The M5 picker inputs: the native input stays the FormData carrier
         (typeable as ever), the calendar button opens the library picker. -->
    <MonthPickerInput
      field={createItem.fields.availableFrom}
      label="Available from"
      required
    />
    <DatePickerInput
      field={createItem.fields.bakedOn}
      label="Baked on"
      showWeekNumbers
      required
    />
    <CheckboxInput field={createItem.fields.inStock} label="In stock" />

    <FormError />

    <div class="flex gap-2">
      <Submit />
      <Reset />
    </div>
  </Form>

  <!-- No pending boundary: it would make the server render the pending
       snippet instead of this list — awaiting bare is what server-renders
       the data. -->
  <ul class="flex flex-col gap-1">
    {#each await getItems() as item (item.id)}
      <li>
        {item.name} ({item.category}{item.inStock ? ", in stock" : ""}, from
        {item.availableFrom}, baked {item.bakedOn})
        {item.description ? ` — ${item.description}` : ""}
        {item.price ? ` — ${item.price}` : ""}
      </li>
    {:else}
      <li class="text-stone-500">No items yet.</li>
    {/each}
  </ul>
</main>
