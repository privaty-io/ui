<script lang="ts">
  import { resolve } from "$app/paths";
</script>

<main class="flex flex-col gap-3">
  <h1 class="text-2xl font-medium">Back office</h1>
  <p class="max-w-prose text-sm text-stone-600 dark:text-stone-400">
    A small realistic app over the component libraries — inventory with inline
    editing and nested batches, the delivery schedule with grouped quarter
    columns, and supplier onboarding with the full form surface. The e2e suite
    drives these pages like a user would.
  </p>
  <ul class="flex flex-col gap-1 underline">
    <li><a href={resolve("app/inventory")}>Inventory</a></li>
    <li><a href={resolve("app/deliveries")}>Deliveries</a></li>
    <li><a href={resolve("app/suppliers")}>Suppliers</a></li>
  </ul>
</main>
