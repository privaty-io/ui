<script lang="ts">
  // Suppliers: the full form surface — text/email, a clearable optional
  // select, all three picker inputs, textarea, checkbox, code-style
  // validation messages, and a live list fed by the query refresh.
  import { toSelectOptions } from "@privaty/ui";
  import FormError from "@privaty/ui-forms/components/form-error.svelte";
  import Reset from "@privaty/ui-forms/components/reset.svelte";
  import Submit from "@privaty/ui-forms/components/submit.svelte";
  import Form from "@privaty/ui-forms/form.svelte";
  import CheckboxInput from "@privaty/ui-forms/inputs/checkbox-input.svelte";
  import DatePickerInput from "@privaty/ui-forms/inputs/date-picker-input.svelte";
  import MonthPickerInput from "@privaty/ui-forms/inputs/month-picker-input.svelte";
  import SelectInput from "@privaty/ui-forms/inputs/select-input.svelte";
  import TextareaInput from "@privaty/ui-forms/inputs/textarea-input.svelte";
  import TextInput from "@privaty/ui-forms/inputs/text-input.svelte";
  import WeekPickerInput from "@privaty/ui-forms/inputs/week-picker-input.svelte";
  import { setUiConfig } from "@privaty/ui";
  import { createSupplier, getSuppliers } from "./data.remote";
  import { createSupplierSchema, regions } from "./schema";

  // Code-style schema messages resolved in ONE place — the validator-code
  // pattern the config exists for.
  setUiConfig({
    resolveMessage: (issue) =>
      ({
        required: "This field is required",
        "too-long": "Too long",
        "invalid-email": "That is not an email address",
        "invalid-date": "Use the date picker or YYYY-MM-DD",
        "invalid-month": "Use the month picker or YYYY-MM",
        "invalid-week": "Use the week picker or YYYY-Www",
      })[issue.message] ?? issue.message,
  });

  const suppliersQuery = getSuppliers();
  const suppliers = $derived(await suppliersQuery);
</script>

<main class="flex flex-col gap-6">
  <h1 class="text-2xl font-medium">Suppliers</h1>

  <div class="grid gap-8 md:grid-cols-2">
    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-medium">Onboard a supplier</h2>
      <Form form={createSupplier} schema={createSupplierSchema}>
        <TextInput field={createSupplier.fields.name} label="Name" required />
        <TextInput field={createSupplier.fields.email} label="Email" required />
        <SelectInput
          field={createSupplier.fields.region}
          label="Region"
          options={toSelectOptions(regions, {
            value: (region) => region,
            label: (region) => region[0].toUpperCase() + region.slice(1),
          })}
          placeholder="No region"
        />
        <DatePickerInput
          field={createSupplier.fields.contractStart}
          label="Contract start"
          required
        />
        <MonthPickerInput
          field={createSupplier.fields.billingMonth}
          label="First billing month"
          required
        />
        <WeekPickerInput
          field={createSupplier.fields.deliveryWeek}
          label="Delivery week"
          required
        />
        <TextareaInput
          field={createSupplier.fields.notes}
          label="Notes"
          rows={3}
        />
        <CheckboxInput
          field={createSupplier.fields.organic}
          label="Certified organic"
        />

        <FormError />

        <div class="flex gap-2">
          <Submit label="Onboard" />
          <Reset />
        </div>
      </Form>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-medium">Current suppliers</h2>
      <ul class="flex flex-col gap-2" data-testid="supplier-list">
        {#each suppliers as supplier (supplier.id)}
          <li class="rounded border border-stone-300 p-3 dark:border-stone-700">
            <p class="font-medium">
              {supplier.name}
              {#if supplier.organic}<span class="ml-1 text-xs text-stone-500"
                  >organic</span
                >{/if}
            </p>
            <p class="text-sm text-stone-600 dark:text-stone-400">
              {supplier.email}
              · {supplier.region ?? "no region"}
              · starts {supplier.contractStart}
              · bills from {supplier.billingMonth}
              · delivers {supplier.deliveryWeek}
            </p>
            {#if supplier.notes}
              <p class="text-sm">{supplier.notes}</p>
            {/if}
          </li>
        {:else}
          <li class="text-sm text-stone-500">No suppliers yet.</li>
        {/each}
      </ul>
    </section>
  </div>
</main>
