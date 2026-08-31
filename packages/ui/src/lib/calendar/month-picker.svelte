<!-- @component
Cross-browser month picker — the replacement for `type="month"` where the
browser has none (Firefox). A year of month cells over the calendar
engine, valued as the native input's "YYYY-MM" strings. Presentational and
Kit-free: bind `value` or use `onselect` (e.g. to close a hosting
Popover). Keyboard: arrows move by month/row, PageUp/PageDown by year,
Home/End to January/December, Enter/Space select. Locale follows the
`locale` prop, then `UiConfig.locale`, then the runtime.
-->
<script lang="ts">
  import { tick } from "svelte";
  import { ChevronLeftIcon, ChevronRightIcon } from "@lucide/svelte";
  import { cn } from "../cn";
  import { getUiConfig } from "../config/context";
  import { coreTheme } from "../theme";
  import { monthNames } from "./calendar";

  interface Props {
    /** Selected month as "YYYY-MM" (bindable); "" = nothing selected. */
    value?: string;
    /** Fires with the ISO month on every pick. */
    onselect?: (iso: string) => void;

    /** Inclusive "YYYY-MM" bounds; months outside become disabled. */
    min?: string;
    max?: string;

    /** BCP 47 tag for month names — overrides `UiConfig.locale`. */
    locale?: string;

    /** Extra classes for the panel. */
    class?: string;
  }

  let {
    value = $bindable(""),
    onselect,

    min,
    max,

    locale,

    class: classes,
  }: Props = $props();

  const config = getUiConfig();
  const resolvedLocale = $derived(locale ?? config.locale);
  const names = $derived(monthNames(resolvedLocale));
  const shortNames = $derived(monthNames(resolvedLocale, "short"));

  const pad = (month: number) => String(month).padStart(2, "0");
  const parse = (iso: string) => {
    const match = /^(\d{4})-(\d{2})$/.exec(iso);
    if (!match) return undefined;
    const month = Number(match[2]);
    return month >= 1 && month <= 12
      ? { year: Number(match[1]), month }
      : undefined;
  };

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

  // Roving-tabindex active month; the displayed year follows it. Writable
  // derived — see DatePicker's `active` for why an effect cannot do this.
  let active = $derived(parse(value) ? value : todayIso);

  const activeParts = $derived(parse(active) ?? parse(todayIso)!);
  const year = $derived(activeParts.year);

  const isoOf = (month: number) =>
    `${String(year).padStart(4, "0")}-${pad(month)}`;
  const isDisabled = (iso: string) =>
    (min !== undefined && iso < min) || (max !== undefined && iso > max);

  let panel = $state<HTMLElement>();

  // Dropdown year range — same policy as DatePicker's.
  const years = $derived.by(() => {
    const from = min ? Number(min.slice(0, 4)) : year - 100;
    const to = max ? Number(max.slice(0, 4)) : year + 100;
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  });

  function move(deltaMonths: number) {
    const index = year * 12 + (activeParts.month - 1) + deltaMonths;
    const next = `${String(Math.floor(index / 12)).padStart(4, "0")}-${pad((((index % 12) + 12) % 12) + 1)}`;
    // Navigation never leaves [min, max] — moves past a bound land ON it.
    active =
      min !== undefined && next < min
        ? min
        : max !== undefined && next > max
          ? max
          : next;
  }

  const previousYearDisabled = $derived(
    min !== undefined && year - 1 < Number(min.slice(0, 4)),
  );
  const nextYearDisabled = $derived(
    max !== undefined && year + 1 > Number(max.slice(0, 4)),
  );

  function select(iso: string, disabled: boolean) {
    if (disabled) return;
    active = iso;
    value = iso;
    onselect?.(iso);
  }

  function onkeydown(event: KeyboardEvent) {
    const handlers: Record<string, () => void> = {
      ArrowLeft: () => move(-1),
      ArrowRight: () => move(1),
      ArrowUp: () => move(-3),
      ArrowDown: () => move(3),
      PageUp: () => move(-12),
      PageDown: () => move(12),
      Home: () => move(1 - activeParts.month),
      End: () => move(12 - activeParts.month),
    };

    const handler = handlers[event.key];
    if (!handler) return;
    event.preventDefault();
    handler();
    // After the state flush — the target button may be a NEW element when
    // the view flipped. tick() beats rAF here: a test (or fast typist) can
    // land the next key before an animation frame ever fires.
    void tick().then(() => {
      panel
        ?.querySelector<HTMLButtonElement>(`button[data-iso="${active}"]`)
        ?.focus();
    });
  }
</script>

<div bind:this={panel} class={cn(coreTheme.calendar.panel, classes)}>
  <div class="flex items-center justify-between gap-1">
    <button
      type="button"
      class={coreTheme.calendar.navButton}
      title={config.labels.calendar.previousYear}
      disabled={previousYearDisabled}
      onclick={() => move(-12)}
    >
      <ChevronLeftIcon class="size-4" aria-hidden="true" />
      <span class="sr-only">{config.labels.calendar.previousYear}</span>
    </button>
    <select
      class={coreTheme.calendar.headerSelect}
      aria-label={config.labels.calendar.year}
      value={year}
      onchange={(event) =>
        move((Number(event.currentTarget.value) - year) * 12)}
    >
      {#each years as option (option)}
        <option value={option}>{option}</option>
      {/each}
    </select>
    <button
      type="button"
      class={coreTheme.calendar.navButton}
      title={config.labels.calendar.nextYear}
      disabled={nextYearDisabled}
      onclick={() => move(12)}
    >
      <ChevronRightIcon class="size-4" aria-hidden="true" />
      <span class="sr-only">{config.labels.calendar.nextYear}</span>
    </button>
  </div>

  <!-- tabindex -1: see DatePicker's grid. -->
  <div
    role="grid"
    tabindex={-1}
    aria-label={String(year)}
    class="mt-1 grid grid-cols-3 gap-0.5"
    {onkeydown}
  >
    {#each [0, 1, 2, 3] as row (row)}
      <div role="row" class="col-span-full grid grid-cols-subgrid">
        {#each [1, 2, 3] as column (column)}
          {@const month = row * 3 + column}
          {@const iso = isoOf(month)}
          <!-- The button IS the gridcell (see DatePicker). -->
          <button
            type="button"
            role="gridcell"
            data-iso={iso}
            tabindex={iso === active ? 0 : -1}
            disabled={isDisabled(iso)}
            aria-selected={iso === value}
            aria-current={iso === todayIso ? "date" : undefined}
            aria-label={`${names[month - 1]} ${year}`}
            class={cn(
              coreTheme.calendar.cell,
              "w-full px-2 py-1.5",
              iso === todayIso && coreTheme.calendar.cellToday,
              iso === value && coreTheme.calendar.cellSelected,
            )}
            onclick={() => select(iso, isDisabled(iso))}
          >
            {shortNames[month - 1]}
          </button>
        {/each}
      </div>
    {/each}
  </div>
</div>
