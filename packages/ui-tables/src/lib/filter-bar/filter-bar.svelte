<!-- @component
A schema-driven filter bar over a `@privaty/query` definition: active
filters render as chips (implicit AND — the wire format's sibling
rule), each editable in a popover whose field, operator, and value
controls derive entirely from the definition. Standalone on purpose —
bind the same `value` to a Table (which owns `orderBy`) and feed it to
your rows query; the bar only ever writes `where`.

Extras: `search` renders a leading quick-search input mapped to
`contains` on a chosen field; `presets` are toggle chips contributing
declared where-fragments while on (or off — "show hidden" is an `off`
fragment that filters hidden rows until toggled), with their state
bindable via `presetState` so external stores can drive them through
the same query value.
-->
<script lang="ts" module>
  import type { Fields, WhereInput } from "@privaty/query";

  /** A toggle chip contributing a declared fragment to the filter. */
  export interface FilterTogglePreset<Fs extends Fields = Fields> {
    type?: "toggle";
    /** Stable identity — the key in `presetState`. */
    key: string;
    label: string;
    /** Fragment AND-ed into the filter while the preset is ON. */
    on?: WhereInput<Fs>;
    /** Fragment AND-ed in while the preset is OFF — the "show hidden"
     * shape: `off: { hidden: { eq: false } }` filters until toggled. */
    off?: WhereInput<Fs>;
    /** Starting state when `presetState` isn't provided. */
    initial?: boolean;
  }

  /** A dropdown choosing ONE of several fragments ("Status: open /
   * closed / all" — an option without `where` contributes nothing). */
  export interface FilterSelectPreset<Fs extends Fields = Fields> {
    type: "select";
    /** Stable identity — the key in `presetState`. */
    key: string;
    /** The select's accessible name. */
    label: string;
    options: readonly {
      value: string;
      label?: string;
      /** Fragment AND-ed in while this option is chosen. */
      where?: WhereInput<Fs>;
    }[];
    /** Starting option when `presetState` isn't provided — defaults to
     * the first option. */
    initial?: string;
  }

  export type FilterPreset<Fs extends Fields = Fields> =
    FilterTogglePreset<Fs> | FilterSelectPreset<Fs>;
</script>

<script lang="ts" generics="Fs extends Fields">
  import { PlusIcon, XIcon } from "@lucide/svelte";
  import {
    Badge,
    Button,
    cn,
    DatePicker,
    Input,
    Popover,
    Select,
  } from "@privaty/ui";
  import type { QueryDef, QueryInput } from "@privaty/query";
  import { untrack } from "svelte";
  import * as v from "valibot";

  import { getUiConfig } from "@privaty/ui";

  import { tableTheme } from "../theme";

  interface Props {
    /** The query definition — fields, kinds, granted ops, value
     * schemas: everything the bar renders derives from it. */
    query: QueryDef<Fs>;
    /** The wire-format value (bindable). The bar owns `where` and
     * preserves everything else (`orderBy` from a bound Table, …). */
    value?: QueryInput<Fs>;
    /** Human labels per field key (defaults to the key itself). */
    labels?: Partial<Record<keyof Fs & string, string>>;
    /** Toggle-chip presets (see FilterPreset). */
    presets?: readonly FilterPreset<Fs>[];
    /** The presets' state (bindable): toggles hold a boolean, selects
     * their chosen option value. Drive it from a store to apply global
     * filters through the same query value. */
    presetState?: Record<string, boolean | string>;
    /** Renders a leading quick-search input mapped to `contains` on
     * this field (the field must grant `contains`). */
    search?: { field: keyof Fs & string; placeholder?: string };
    /** Extra classes for the bar. */
    class?: string;
  }

  let {
    query,
    value = $bindable(undefined),
    labels = {},
    presets = [],
    presetState = $bindable(
      Object.fromEntries(
        presets.map((preset) => [
          preset.key,
          preset.type === "select"
            ? (preset.initial ?? preset.options[0]?.value ?? "")
            : (preset.initial ?? false),
        ]),
      ),
    ),
    search,
    class: classes,
  }: Props = $props();

  const config = getUiConfig();

  interface Chip {
    id: number;
    field: string;
    op: string;
    value: unknown;
  }

  let chips = $state<Chip[]>([]);
  let nextChipId = 0;
  /** The committed quick-search text (the input debounces into it). */
  let searchText = $state("");
  let searchDraft = $state("");
  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  // ONE where tree from all three sources, each chip its own node so
  // same-field chips never collide in the map style.
  const where = $derived.by(() => {
    const siblings: WhereInput<Fs>[] = [];
    for (const chip of chips) {
      siblings.push({
        [chip.field]: { [chip.op]: chip.value },
      } as WhereInput<Fs>);
    }
    const quick = searchText.trim();
    if (search && quick.length > 0) {
      siblings.push({
        [search.field]: { contains: quick },
      } as unknown as WhereInput<Fs>);
    }
    for (const preset of presets) {
      const fragment =
        preset.type === "select"
          ? preset.options.find(
              (option) => option.value === presetState[preset.key],
            )?.where
          : presetState[preset.key]
            ? preset.on
            : preset.off;
      if (fragment) siblings.push(fragment);
    }
    if (siblings.length === 0) return undefined;
    return siblings.length === 1 ? siblings[0] : { and: siblings };
  });

  // Write-through: the bar owns `where`; everything else in `value`
  // belongs to other writers (a Table's orderBy) and is preserved.
  // `value` is read untracked — both writers preserve each other's
  // keys, so no feedback loop.
  $effect(() => {
    const nextWhere = where;
    untrack(() => {
      const { where: _previous, ...rest } = value ?? {};
      void _previous;
      const merged = nextWhere ? { ...rest, where: nextWhere } : rest;
      value =
        Object.keys(merged).length > 0 ? (merged as QueryInput<Fs>) : undefined;
    });
  });

  const fieldLabel = (key: string) => labels[key as keyof Fs & string] ?? key;

  const opLabels: Record<string, string> = {
    eq: "=",
    ne: "≠",
    gt: ">",
    gte: "≥",
    lt: "<",
    lte: "≤",
    in: "in",
    notIn: "not in",
    contains: "contains",
    startsWith: "starts with",
    endsWith: "ends with",
    like: "like",
    ilike: "ilike",
    isNull: "is empty",
    isNotNull: "is set",
  };
  const opLabel = (name: string) => opLabels[name] ?? name;

  function chipText(chip: Chip): string {
    const def = query.fields[chip.field];
    const op = def?.ops.find((candidate) => candidate.name === chip.op);
    if (op?.shape === "flag") {
      return `${fieldLabel(chip.field)} ${opLabel(chip.op)}`;
    }
    const rendered = Array.isArray(chip.value)
      ? chip.value.join(", ")
      : String(chip.value);
    return `${fieldLabel(chip.field)} ${opLabel(chip.op)} ${rendered}`;
  }

  // ---- The editor (one draft, whichever popover is open) ----

  let addOpen = $state(false);
  let chipOpen = $state<Record<number, boolean>>({});
  let editingId = $state<number | undefined>(undefined);
  let draftField = $state("");
  let draftOp = $state("");
  let draftText = $state("");
  // Its own state: Svelte binds type="number" inputs as NUMBERS, and
  // the union must not leak into the string-bound controls.
  let draftNumber = $state<number | string>("");
  let draftChecks = $state<string[]>([]);
  let draftError = $state<string | undefined>(undefined);

  // The definition is stable for the bar's lifetime (the Column
  // registration contract) — captured once by design.
  // svelte-ignore state_referenced_locally
  const fieldKeys = Object.keys(query.fields);
  const fieldOptions = fieldKeys.map((key) => ({
    value: key,
    label: fieldLabel(key),
  }));

  const draftDef = $derived(query.fields[draftField]);
  const draftOps = $derived(draftDef?.ops ?? []);
  const draftOpDef = $derived(
    draftOps.find((candidate) => candidate.name === draftOp),
  );
  const opOptions = $derived(
    draftOps.map((op) => ({ value: op.name, label: opLabel(op.name) })),
  );
  /** A `v.picklist` value schema upgrades the value editor to options. */
  const draftPicklist = $derived.by(() => {
    const schema = draftDef?.schema as { type?: string; options?: unknown };
    return schema?.type === "picklist" && Array.isArray(schema.options)
      ? (schema.options as string[])
      : undefined;
  });

  function resetDraftValue() {
    draftText = "";
    draftNumber = "";
    draftChecks = [];
    draftError = undefined;
  }

  function onFieldChange() {
    draftOp = draftOps[0]?.name ?? "";
    resetDraftValue();
  }

  function seedNew() {
    editingId = undefined;
    draftField = fieldKeys[0] ?? "";
    draftOp = query.fields[draftField]?.ops[0]?.name ?? "";
    resetDraftValue();
  }

  function seedChip(chip: Chip) {
    editingId = chip.id;
    draftField = chip.field;
    draftOp = chip.op;
    resetDraftValue();
    if (Array.isArray(chip.value)) {
      const picklist = query.fields[chip.field];
      void picklist;
      draftChecks = chip.value.map(String);
      draftText = chip.value.join(", ");
    } else if (typeof chip.value === "number") {
      draftNumber = chip.value;
    } else if (chip.value !== true || typeof chip.value === "boolean") {
      draftText = String(chip.value);
    }
  }

  function castKind(kind: string, raw: string | number): unknown {
    if (kind === "number") {
      if (typeof raw === "number") return raw;
      return raw.trim() === "" ? raw : Number(raw);
    }
    if (kind === "boolean") return raw === "true";
    return raw;
  }

  function closeEditor() {
    addOpen = false;
    if (editingId !== undefined) chipOpen[editingId] = false;
  }

  function applyDraft() {
    const def = query.fields[draftField];
    const op = draftOpDef;
    if (!def || !op) return;

    let parsed: unknown;
    if (op.shape === "flag") {
      parsed = true;
    } else if (op.shape === "list") {
      const raw = draftPicklist
        ? [...draftChecks]
        : String(draftText)
            .split(",")
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
            .map((part) => castKind(def.kind, part));
      const result = v.safeParse(
        v.pipe(v.array(def.schema), v.minLength(1)),
        raw,
      );
      if (!result.success) {
        draftError = result.issues[0].message;
        return;
      }
      parsed = result.output;
    } else {
      const raw =
        def.kind === "number" && !draftPicklist ? draftNumber : draftText;
      const result = v.safeParse(def.schema, castKind(def.kind, raw));
      if (!result.success) {
        draftError = result.issues[0].message;
        return;
      }
      parsed = result.output;
    }

    const next: Chip = {
      id: editingId ?? (nextChipId += 1),
      field: draftField,
      op: draftOp,
      value: parsed,
    };
    // The open-state entry must exist BEFORE the chip's popover binds
    // to it — `bind:open={undefined}` against a fallback is an error.
    if (chipOpen[next.id] === undefined) chipOpen[next.id] = false;
    chips =
      editingId === undefined
        ? [...chips, next]
        : chips.map((chip) => (chip.id === editingId ? next : chip));
    closeEditor();
  }

  function removeChip(id: number) {
    chips = chips.filter((chip) => chip.id !== id);
    delete chipOpen[id];
  }

  function clearAll() {
    chips = [];
    searchText = "";
    searchDraft = "";
  }

  const hasActive = $derived(chips.length > 0 || searchText.trim().length > 0);

  function onSearchInput() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchText = searchDraft;
    }, 300);
  }

  function onSearchKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter") return;
    clearTimeout(searchTimer);
    searchText = searchDraft;
  }
</script>

{#snippet editorPanel()}
  <div class={tableTheme.filterBar.editor}>
    <Select
      label={config.labels.table.filterField}
      options={fieldOptions}
      bind:value={draftField}
      onchange={onFieldChange}
    />
    <Select
      label={config.labels.table.filterOperator}
      options={opOptions}
      bind:value={draftOp}
      onchange={resetDraftValue}
    />
    {#if draftOpDef && draftOpDef.shape !== "flag"}
      {#if draftOpDef.shape === "list" && draftPicklist}
        <fieldset class="flex flex-col gap-1">
          <legend class="sr-only">{config.labels.table.filterValue}</legend>
          {#each draftPicklist as option (option)}
            <label class="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draftChecks.includes(option)}
                onchange={() =>
                  (draftChecks = draftChecks.includes(option)
                    ? draftChecks.filter((candidate) => candidate !== option)
                    : [...draftChecks, option])}
              />
              {option}
            </label>
          {/each}
        </fieldset>
      {:else if draftPicklist}
        <Select
          label={config.labels.table.filterValue}
          options={draftPicklist}
          bind:value={draftText}
        />
      {:else if draftDef?.kind === "boolean"}
        <Select
          label={config.labels.table.filterValue}
          options={[
            { value: "true", label: "true" },
            { value: "false", label: "false" },
          ]}
          bind:value={draftText}
        />
      {:else if draftDef?.kind === "date"}
        <DatePicker bind:value={draftText} />
      {:else if draftDef?.kind === "number" && draftOpDef.shape !== "list"}
        <Input
          label={config.labels.table.filterValue}
          type="number"
          bind:value={draftNumber}
          onkeydown={(event: KeyboardEvent) => {
            if (event.key === "Enter") applyDraft();
          }}
        />
      {:else}
        <Input
          label={config.labels.table.filterValue}
          placeholder={draftOpDef.shape === "list"
            ? config.labels.table.filterListHint
            : undefined}
          bind:value={draftText}
          onkeydown={(event: KeyboardEvent) => {
            if (event.key === "Enter") applyDraft();
          }}
        />
      {/if}
    {/if}
    {#if draftError}
      <p class="text-sm text-red-700 dark:text-red-500">{draftError}</p>
    {/if}
    <div class={tableTheme.filterBar.editorFooter}>
      <Button variant="ghost" type="button" onclick={closeEditor}>
        {config.labels.table.cancel}
      </Button>
      <Button type="button" onclick={applyDraft}>
        {config.labels.table.filterApply}
      </Button>
    </div>
  </div>
{/snippet}

<div class={cn(tableTheme.filterBar.bar, classes)}>
  {#if search}
    <div class={tableTheme.filterBar.search}>
      <Input
        label={config.labels.table.filterSearch}
        labelStyle="hidden"
        placeholder={search.placeholder ?? config.labels.table.filterSearch}
        bind:value={searchDraft}
        oninput={onSearchInput}
        onkeydown={onSearchKeydown}
      />
    </div>
  {/if}

  {#each chips as chip (chip.id)}
    <span class={tableTheme.filterBar.chip}>
      <Popover bind:open={chipOpen[chip.id]} placement="bottom">
        {#snippet trigger(props)}
          <button
            {...props}
            class={tableTheme.filterBar.chipButton}
            onclick={() => seedChip(chip)}
            onkeydown={(event) => {
              if (event.key === "Delete" || event.key === "Backspace") {
                event.preventDefault();
                removeChip(chip.id);
              }
            }}
          >
            {chipText(chip)}
          </button>
        {/snippet}
        <!-- Lazy: a CLOSED chip's panel would otherwise duplicate the
             editor (and its labeled controls) once per chip. -->
        {#if chipOpen[chip.id]}
          {@render editorPanel()}
        {/if}
      </Popover>
      <button
        type="button"
        class={tableTheme.filterBar.chipRemove}
        aria-label={`${config.labels.table.filterRemove}: ${chipText(chip)}`}
        onclick={() => removeChip(chip.id)}
      >
        <XIcon class="size-3.5" aria-hidden="true" />
      </button>
    </span>
  {/each}

  {#each presets as preset (preset.key)}
    {#if preset.type === "select"}
      <div class={tableTheme.filterBar.presetSelect}>
        <Select
          label={preset.label}
          labelStyle="hidden"
          options={preset.options.map((option) => ({
            value: option.value,
            label: option.label ?? option.value,
          }))}
          bind:value={
            () => String(presetState[preset.key] ?? ""),
            (next) => (presetState = { ...presetState, [preset.key]: next })
          }
        />
      </div>
    {:else}
      <button
        type="button"
        class={tableTheme.filterBar.preset}
        aria-pressed={presetState[preset.key] === true}
        onclick={() =>
          (presetState = {
            ...presetState,
            [preset.key]: !presetState[preset.key],
          })}
      >
        {preset.label}
      </button>
    {/if}
  {/each}

  <Popover bind:open={addOpen} placement="bottom">
    {#snippet trigger(props)}
      <button {...props} class={tableTheme.filterBar.add} onclick={seedNew}>
        <PlusIcon class="size-3.5" aria-hidden="true" />
        {config.labels.table.filterAdd}
      </button>
    {/snippet}
    {#if addOpen}
      {@render editorPanel()}
    {/if}
  </Popover>

  {#if hasActive}
    <Badge>{chips.length + (searchText.trim() ? 1 : 0)}</Badge>
    <Button variant="text" type="button" onclick={clearAll}>
      {config.labels.table.filterClear}
    </Button>
  {/if}
</div>
