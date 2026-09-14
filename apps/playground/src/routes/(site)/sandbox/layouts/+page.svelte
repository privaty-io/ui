<script lang="ts">
  // The dashboard page: the SidebarPage's bare main track hands this
  // page the space raw, so it lays its own tiles directly on the canvas
  // — the gap matches the canvas gutters and it reads as one system.
  import { Badge, Button, Tile, TileTitle } from "@privaty/ui";

  const stats = [
    { label: "Bottles in cellar", value: "1 284" },
    { label: "Incoming this week", value: "36" },
    { label: "Reserved", value: "112" },
    { label: "Low-stock alerts", value: "3", tone: "critical" as const },
  ];

  const arrivals = [
    { wine: "2021 Chinon, Domaine Baudry", qty: 18, status: "shelved" },
    { wine: "2022 Riesling Kabinett", qty: 24, status: "checking" },
    { wine: "2019 Château Meyney", qty: 12, status: "shelved" },
    { wine: "2020 Etna Rosso", qty: 30, status: "shelved" },
  ];

  const tasks = [
    "Confirm Friday's delivery window with Bar Centrale",
    "Re-count bin 14 after the low-stock alert",
    "Draft the autumn tasting invitation",
  ];
</script>

<svelte:head>
  <title>Layouts — sandbox</title>
</svelte:head>

<div class="grid h-full grid-cols-2 grid-rows-[auto_minmax(0,1fr)] gap-1.5">
  <Tile label="Stock overview" class="col-span-2">
    <div class="flex flex-col gap-3 p-2">
      <div>
        <h1 class="text-lg font-medium">Cellar dashboard</h1>
        <p class="text-sm text-stone-500">
          A page composed on the SidebarPage's bare main track — the panel
          button compacts the nav to an icon rail, gutters drag, and the shell
          persists as you navigate.
        </p>
      </div>
      <div class="flex flex-wrap items-end gap-8">
        {#each stats as stat (stat.label)}
          <div class="flex flex-col">
            <span class="text-xs text-stone-500">{stat.label}</span>
            <span class="flex items-baseline gap-2 text-2xl tabular-nums">
              {stat.value}
              {#if stat.tone}
                <Badge tone={stat.tone}>check</Badge>
              {/if}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </Tile>

  <Tile label="Recent arrivals" class="overflow-y-auto">
    <TileTitle title="Recent arrivals" />
    <ul class="flex flex-col gap-2 text-sm">
      {#each arrivals as arrival (arrival.wine)}
        <li class="flex items-baseline gap-2">
          <span class="min-w-0 truncate">{arrival.wine}</span>
          <span class="text-xs text-stone-500 tabular-nums">
            ×{arrival.qty}
          </span>
          <Badge
            class="ml-auto"
            tone={arrival.status === "checking" ? "warning" : "positive"}
          >
            {arrival.status}
          </Badge>
        </li>
      {/each}
    </ul>
  </Tile>

  <Tile label="Open tasks" class="overflow-y-auto">
    <TileTitle title="Open tasks">
      {#snippet actions()}
        <Badge>{tasks.length}</Badge>
      {/snippet}
    </TileTitle>
    <ul class="flex flex-col gap-1 text-sm">
      {#each tasks as task (task)}
        <li>
          <Button
            variant="text"
            type="button"
            class="justify-start px-0.5 text-left"
          >
            {task}
          </Button>
        </li>
      {/each}
    </ul>
  </Tile>
</div>
