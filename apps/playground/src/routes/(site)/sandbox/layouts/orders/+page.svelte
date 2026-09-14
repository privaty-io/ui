<script lang="ts">
  // The orders page: a ListDetail on the shell's bare main track — pick
  // a row on the left, read it at length on the right, drag the gutter
  // between them.
  import { Badge, Button, cn, Divider, TileTitle } from "@privaty/ui";
  import { ListDetail } from "@privaty/ui-layouts";

  interface Order {
    id: string;
    customer: string;
    wine: string;
    qty: number;
    status: "pending" | "packed" | "shipped";
    note: string;
  }

  const orders: Order[] = [
    {
      id: "ORD-2107",
      customer: "Bar Centrale",
      wine: "2019 Château Meyney",
      qty: 12,
      status: "pending",
      note: "Deliver before Friday — restaurant tasting on Saturday.",
    },
    {
      id: "ORD-2108",
      customer: "Hotel Lindenhof",
      wine: "2022 Riesling Kabinett",
      qty: 24,
      status: "packed",
      note: "Loading dock closes at 15:00.",
    },
    {
      id: "ORD-2109",
      customer: "Vinothek Nord",
      wine: "2015 Barolo Riserva",
      qty: 6,
      status: "shipped",
      note: "Signature required on arrival.",
    },
    {
      id: "ORD-2110",
      customer: "Café Aurelie",
      wine: "2021 Chinon",
      qty: 18,
      status: "pending",
      note: "First order — include the tasting brochure.",
    },
  ];

  let selectedId = $state(orders[0].id);
  const selected = $derived(
    orders.find((order) => order.id === selectedId) ?? orders[0],
  );

  const statusTone = {
    pending: "warning",
    packed: "neutral",
    shipped: "positive",
  } as const;
</script>

<svelte:head>
  <title>Orders — layouts sandbox</title>
</svelte:head>

<ListDetail
  listLabel="Orders"
  detailLabel="Order detail"
  resizeLabel="Resize orders list"
  initial={260}
  min={200}
  max={400}
>
  {#snippet list()}
    <TileTitle title="Orders">
      {#snippet actions()}
        <Badge>{orders.length}</Badge>
      {/snippet}
    </TileTitle>
    <div class="flex flex-col gap-1 text-sm">
      {#each orders as order (order.id)}
        <Button
          variant="ghost"
          type="button"
          class={cn(
            "justify-start px-2 whitespace-nowrap",
            order.id === selectedId &&
              "bg-stone-200/70 font-medium dark:bg-stone-800",
          )}
          aria-current={order.id === selectedId ? "true" : undefined}
          onclick={() => (selectedId = order.id)}
        >
          {order.id} · {order.customer}
        </Button>
      {/each}
    </div>
  {/snippet}
  {#snippet detail()}
    <TileTitle title={selected.id}>
      {#snippet actions()}
        <Badge tone={statusTone[selected.status]}>{selected.status}</Badge>
      {/snippet}
    </TileTitle>
    <div class="flex max-w-xl flex-col gap-3 text-sm">
      <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
        <dt class="text-stone-500">Customer</dt>
        <dd>{selected.customer}</dd>
        <dt class="text-stone-500">Wine</dt>
        <dd>{selected.wine}</dd>
        <dt class="text-stone-500">Bottles</dt>
        <dd class="tabular-nums">{selected.qty}</dd>
      </dl>
      <Divider label="Delivery note" />
      <p class="text-stone-600 dark:text-stone-400">{selected.note}</p>
      <div class="flex gap-2">
        <Button type="button">Mark packed</Button>
        <Button variant="secondary" type="button">Print label</Button>
      </div>
    </div>
  {/snippet}
</ListDetail>
