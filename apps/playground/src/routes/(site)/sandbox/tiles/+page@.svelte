<script lang="ts">
  // Tiling system showcase: a full back-office shell where every section
  // is a Tile and every boundary is a draggable TileSplit — the VS Code
  // modern-UI composition. Hover a pane to feel its border; Tab or click
  // into one and it marks the section you're in. Grab a gutter to
  // resize; drag the nav hard left to collapse it; double-click a
  // gutter to reset it; focus a gutter and use the arrow keys.
  import {
    Badge,
    Button,
    Checkbox,
    DatePicker,
    Divider,
    Input,
    Kbd,
    Select,
    Skeleton,
    Textarea,
    ThemeToggle,
    Tile,
    TileSplit,
    TileTitle,
  } from "@privaty/ui";

  let search = $state("");
  let name = $state("");
  let region = $state("");
  let notes = $state("");
  let organic = $state(false);
  let delivery = $state("2026-09-18");

  // Bindable split sizes — an app would persist these per user.
  let navSize = $state(230);
  let railSize = $state(320);

  const activity: {
    at: string;
    text: string;
    flag?: { tone: "positive" | "warning" | "critical"; label: string };
  }[] = [
    {
      at: "09:12",
      text: "Rioja Reserva restocked (42 → 60)",
      flag: { tone: "positive", label: "done" },
    },
    { at: "10:03", text: "Fromagerie Petit onboarded" },
    { at: "11:47", text: "Gift basket price adjusted" },
    {
      at: "13:20",
      text: "Batch CT-2611 flagged for QA",
      flag: { tone: "warning", label: "QA" },
    },
    {
      at: "14:05",
      text: "Époisses low-stock warning",
      flag: { tone: "critical", label: "low" },
    },
  ];
</script>

<svelte:head>
  <title>Tiles — sandbox</title>
</svelte:head>

<!-- The `@` in the filename resets past the sandbox Page layout: this
     demo fills the Frame's column itself. No canvas of its own — the
     root Frame's shows through the gaps. -->
<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5">
  <!-- Header: brand + global actions -->
  <Tile label="Header" class="flex items-center gap-4">
    <span class="text-sm font-semibold tracking-wide">Fromage HQ</span>
    <span class="text-xs text-stone-500">tiling system preview</span>
    <div class="ml-auto flex w-72 items-center gap-2">
      <Input
        label="Search"
        labelStyle="hidden"
        placeholder="Search everything…"
        bind:value={search}
      />
      <Divider vertical />
      <Button variant="secondary" type="button">Sync</Button>
      <!-- The site chrome is reset away on this demo — it brings its
           own theme toggle. -->
      <ThemeToggle />
    </div>
  </Tile>

  <!-- The pane tree: nav | (main | rail), rail itself split vertically.
         Every gutter is draggable, keyboard-resizable, double-click
         resettable. -->
  <TileSplit
    class="min-h-0 flex-1"
    bind:size={navSize}
    initial={230}
    min={170}
    max={360}
    collapsible
    label="Resize navigation"
  >
    {#snippet start()}
      <Tile label="Navigation" class="flex h-full flex-col gap-1 text-sm">
        <!-- The ghost variant IS the side-nav look — blends into the
               tile until hovered; the active item keeps a resting wash. -->
        {#each ["Dashboard", "Inventory", "Deliveries", "Suppliers", "Reports"] as entry, index (entry)}
          <Button
            variant="ghost"
            type="button"
            class="justify-start px-2 whitespace-nowrap
                {index === 0
              ? 'bg-stone-200/70 font-medium dark:bg-stone-800'
              : ''}"
          >
            {entry}
          </Button>
        {/each}
        <div
          class="mt-auto border-t border-stone-300/60 pt-2 text-xs whitespace-nowrap text-stone-500 dark:border-stone-800"
        >
          Signed in as Lukas
        </div>
      </Tile>
    {/snippet}
    {#snippet end()}
      <TileSplit
        sized="end"
        bind:size={railSize}
        initial={320}
        min={240}
        max={480}
        label="Resize side panel"
      >
        {#snippet start()}
          <Tile label="Supplier onboarding" class="h-full overflow-y-auto">
            <div class="mx-auto flex max-w-xl flex-col gap-4">
              <div>
                <h1 class="text-lg font-medium">Onboard a supplier</h1>
                <p class="text-sm text-stone-500">
                  Tab through the page — the pane you're in stays marked. Grab a
                  gutter to resize; drag the nav hard left to collapse it;
                  double-click a gutter to reset.
                </p>
              </div>
              <Input label="Name" bind:value={name} required />
              <Select
                label="Region"
                bind:value={region}
                placeholder="No region"
                options={["France", "Spain", "Portugal", "Germany"]}
              />
              <Divider label="Optional details" />
              <Textarea label="Notes" bind:value={notes} rows={3} />
              <Checkbox label="Certified organic" bind:checked={organic} />
              <div class="flex gap-2">
                <Button type="button">Onboard</Button>
                <Button variant="secondary" type="button">Discard</Button>
              </div>
            </div>
          </Tile>
        {/snippet}
        {#snippet end()}
          <TileSplit
            orientation="vertical"
            class="h-full"
            initial={330}
            min={220}
            max={440}
            label="Resize delivery panel"
          >
            {#snippet start()}
              <Tile
                label="Next delivery"
                class="flex h-full flex-col items-center gap-1 overflow-hidden"
              >
                <TileTitle title="Next delivery" class="self-stretch" />
                <DatePicker bind:value={delivery} />
              </Tile>
            {/snippet}
            {#snippet end()}
              <Tile label="Activity" class="h-full overflow-y-auto">
                <TileTitle title="Activity">
                  {#snippet actions()}
                    <Badge>{activity.length} today</Badge>
                  {/snippet}
                </TileTitle>
                <ul class="flex flex-col gap-2 text-sm">
                  {#each activity as entry (entry.at)}
                    <li class="flex items-baseline gap-2">
                      <span class="text-xs text-stone-500 tabular-nums">
                        {entry.at}
                      </span>
                      <!-- The text variant blends into copy until
                             hovered — inline actions and links share it. -->
                      <Button
                        variant="text"
                        type="button"
                        class="justify-start px-0.5 text-left"
                      >
                        {entry.text}
                      </Button>
                      {#if entry.flag}
                        <Badge tone={entry.flag.tone} class="ml-auto">
                          {entry.flag.label}
                        </Badge>
                      {/if}
                    </li>
                  {/each}
                </ul>
                <!-- The feed's next page, still on its way. -->
                <div class="mt-3">
                  <Skeleton lines={2} />
                </div>
              </Tile>
            {/snippet}
          </TileSplit>
        {/snippet}
      </TileSplit>
    {/snippet}
  </TileSplit>

  <!-- Status bar: still — pure display, never holds focus -->
  <Tile
    still
    label="Status"
    class="flex items-center gap-4 py-2 text-xs text-stone-500"
  >
    <span>nav {navSize}px · rail {railSize}px</span>
    <span class="ml-auto flex items-center gap-1.5">
      drag gutters · double-click resets · <Kbd>←</Kbd><Kbd>→</Kbd> resize ·
      <Kbd>Home</Kbd> collapses when a gutter is focused
    </span>
  </Tile>
</div>
