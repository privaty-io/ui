<script lang="ts">
  // Deliveries: the schedule shape — grouped quarter columns under year
  // headers, a pinned supplier column, initial scroll anchored on the
  // current year, and controller jumps.
  import Button from "@privaty/ui/components/button.svelte";
  import Column from "@privaty/ui-tables/column.svelte";
  import { TableController } from "@privaty/ui-tables/table-controller.svelte.js";
  import Table from "@privaty/ui-tables/table.svelte";
  import { getSchedule, type SupplierSchedule } from "./data.remote";

  const controller = new TableController();
  let density = $state<"comfortable" | "compact">("comfortable");

  // Declared BEFORE any await-adjacent reactivity: under async SSR the
  // Table's children snippet can run before later script lines settle.
  // Five years of quarters: the schedule must OVERFLOW the shell at any
  // reasonable viewport, or initialColumn and the jump buttons are no-ops
  // (the e2e suite caught exactly that with three years).
  const years = [2024, 2025, 2026, 2027, 2028];
  const quarters = years.flatMap((year) =>
    [1, 2, 3, 4].map((quarter) => ({
      key: `${year}-q${quarter}`,
      year: String(year),
      label: `Q${quarter}`,
    })),
  );

  const scheduleQuery = getSchedule();
</script>

<main class="flex flex-col gap-4">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-medium">Deliveries</h1>
    <div class="flex gap-2">
      <Button
        variant="secondary"
        type="button"
        onclick={() =>
          controller.scrollToColumn("2025-q1", { behavior: "smooth" })}
      >
        2025
      </Button>
      <Button
        variant="secondary"
        type="button"
        onclick={() =>
          controller.scrollToColumn("2027-q1", { behavior: "smooth" })}
      >
        2027
      </Button>
      <Button
        variant="secondary"
        type="button"
        onclick={() =>
          (density = density === "compact" ? "comfortable" : "compact")}
      >
        Density: {density}
      </Button>
    </div>
  </div>

  <div class="h-96">
    <Table
      rows={scheduleQuery}
      rowKey={(row) => row.id}
      {controller}
      initialColumn="2026-q1"
      {density}
    >
      <Column
        key="supplier"
        label="Supplier"
        value={(row: SupplierSchedule) => row.supplier}
        pin="left"
        sortable
      />
      {#each quarters as quarter (quarter.key)}
        <Column
          key={quarter.key}
          label={quarter.label}
          group={quarter.year}
          value={(row: SupplierSchedule) => row.volumes[quarter.key]}
        />
      {/each}
    </Table>
  </div>
</main>
