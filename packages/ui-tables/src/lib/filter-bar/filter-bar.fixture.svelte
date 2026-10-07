<script lang="ts">
  import {
    defineQuery,
    equality,
    field,
    nullable,
    ordering,
    scalar,
    str,
  } from "@privaty/query";
  import type { QueryInput } from "@privaty/query";

  type Q = QueryInput<(typeof query)["fields"]>;
  import * as v from "valibot";

  import FilterBar, { type FilterPreset } from "./filter-bar.svelte";

  const query = defineQuery({
    name: field({ kind: "string", schema: v.string(), ops: str }),
    price: field({
      kind: "number",
      schema: v.number(),
      ops: [...scalar, ...ordering, ...nullable],
    }),
    category: field({
      kind: "string",
      schema: v.picklist(["cheese", "wine", "bread"]),
      ops: scalar,
    }),
    hidden: field({ kind: "boolean", schema: v.boolean(), ops: equality }),
  });

  const presets: FilterPreset<(typeof query)["fields"]>[] = [
    { key: "hidden", label: "Show hidden", off: { hidden: { eq: false } } },
    {
      type: "select",
      key: "category",
      label: "Category preset",
      options: [
        { value: "all" },
        { value: "cheese", where: { category: { eq: "cheese" } } },
        { value: "wine", where: { category: { eq: "wine" } } },
      ],
    },
  ];

  interface Props {
    withPresets?: boolean;
    withSearch?: boolean;
    initialValue?: Q;
  }

  const {
    withPresets = false,
    withSearch = false,
    initialValue,
  }: Props = $props();

  // The spec parameterizes the starting value — captured once by design.
  // svelte-ignore state_referenced_locally
  let value = $state<Q | undefined>(initialValue);
  let presetState = $state<Record<string, boolean | string>>({
    hidden: false,
    category: "all",
  });

  export function currentValue() {
    return value;
  }
  export function currentPresets() {
    return presetState;
  }
  export function setPreset(key: string, state: boolean | string) {
    presetState = { ...presetState, [key]: state };
  }
</script>

<FilterBar
  {query}
  bind:value
  labels={{ name: "Name", price: "Price" }}
  presets={withPresets ? presets : []}
  bind:presetState
  search={withSearch
    ? { field: "name", placeholder: "Quick search" }
    : undefined}
/>
