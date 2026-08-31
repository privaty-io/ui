<!-- @component
Cross-browser date picker — a month grid over the headless calendar engine,
valued in the same "YYYY-MM-DD" strings a native date input submits.
Presentational and Kit-free: bind `value` (or listen to `onselect`, e.g. to
close a hosting Popover) and wire it to a form yourself. Full keyboard
support via a roving-tabindex ARIA grid: arrows move by day/week, PageUp/
PageDown by month (with Shift: by year), Home/End to the week's ends,
Enter/Space select. Locale (names, first weekday) follows the `locale`
prop, then `UiConfig.locale`, then the runtime.
-->
<script lang="ts">
  import { tick } from "svelte";
  import { ChevronLeftIcon, ChevronRightIcon } from "@lucide/svelte";
  import { cn } from "../cn";
  import { getUiConfig } from "../config/context";
  import { coreTheme } from "../theme";
  import {
    addMonths,
    calendarMonth,
    daysInMonth,
    firstDayOfWeek as localeFirstDayOfWeek,
    formatIsoDate,
    monthNames,
    parseIsoDate,
    weekdayNames,
  } from "./calendar";

  interface Props {
    /** Selected date as "YYYY-MM-DD" (bindable); "" = nothing selected. */
    value?: string;
    /** Fires with the ISO date on every pick — close a hosting Popover
     * here. */
    onselect?: (iso: string) => void;

    /** Inclusive ISO bounds; days outside become disabled. */
    min?: string;
    max?: string;
    /** Marks additional days disabled (booked dates, weekends, …). */
    isDateDisabled?: (iso: string) => boolean;

    /** BCP 47 tag for names and the default week start — overrides
     * `UiConfig.locale`; undefined falls back to the runtime's locale. */
    locale?: string;
    /** ISO weekday the grid starts on (Monday = 1 … Sunday = 7). Defaults
     * to the locale's convention. */
    firstDayOfWeek?: number;
    /** Adds the ISO week-number column (the Danish habit). */
    showWeekNumbers?: boolean;

    /** Extra classes for the panel. */
    class?: string;
  }

  let {
    value = $bindable(""),
    onselect,

    min,
    max,
    isDateDisabled,

    locale,
    firstDayOfWeek,
    showWeekNumbers = false,

    class: classes,
  }: Props = $props();

  const config = getUiConfig();
  const resolvedLocale = $derived(locale ?? config.locale);
  const weekStart = $derived(
    firstDayOfWeek ?? localeFirstDayOfWeek(resolvedLocale),
  );

  // Local-timezone today, computed once — the user's calendar day, not the
  // server's (renders again on the client either way).
  const now = new Date();
  const todayIso = formatIsoDate(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );

  // The roving-tabindex active day — where keyboard focus lives within the
  // grid. A WRITABLE derived: it follows `value` (an external bind change
  // re-derives it), while keyboard roving assigns local overrides. A plain
  // effect syncing value→active cannot tell those apart and would snap
  // every arrow-key move straight back to the selection.
  let active = $derived(parseIsoDate(value) ? value : todayIso);

  // The displayed month follows the active day.
  const activeParts = $derived(parseIsoDate(active) ?? parseIsoDate(todayIso)!);
  const view = $derived({ year: activeParts.year, month: activeParts.month });

  const grid = $derived(
    calendarMonth(view.year, view.month, {
      firstDayOfWeek: weekStart,
      fixedWeeks: true,
      today: todayIso,
      min,
      max,
      isDateDisabled,
    }),
  );

  const titleFormat = $derived(
    new Intl.DateTimeFormat(resolvedLocale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
  );
  const title = $derived(
    titleFormat.format(new Date(Date.UTC(view.year, view.month - 1, 1))),
  );
  const dayLabelFormat = $derived(
    new Intl.DateTimeFormat(resolvedLocale, {
      dateStyle: "full",
      timeZone: "UTC",
    }),
  );
  const weekdays = $derived(weekdayNames(resolvedLocale, "short", weekStart));
  const months = $derived(monthNames(resolvedLocale));

  // Dropdown year range: clamp to min/max where given, a century each way
  // otherwise — recentered on the active year, so picking an edge year
  // extends the range further.
  const years = $derived.by(() => {
    const from = min ? parseIsoDate(min)!.year : view.year - 100;
    const to = max ? parseIsoDate(max)!.year : view.year + 100;
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  });

  // Navigation never leaves [min, max]: a move past a bound lands ON the
  // bound (the year dropdown's range already respects this).
  function clampIso(iso: string): string {
    if (min !== undefined && iso < min) return min;
    if (max !== undefined && iso > max) return max;
    return iso;
  }

  function jumpTo(year: number, month: number) {
    active = clampIso(
      formatIsoDate(
        year,
        month,
        Math.min(activeParts.day, daysInMonth(year, month)),
      ),
    );
  }

  // "YYYY-MM" prefixes compare lexicographically like full dates do.
  const minMonth = $derived(min?.slice(0, 7));
  const maxMonth = $derived(max?.slice(0, 7));
  const monthKey = (year: number, month: number) =>
    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;

  const previousDisabled = $derived.by(() => {
    if (minMonth === undefined) return false;
    const previous = addMonths(view.year, view.month, -1);
    return monthKey(previous.year, previous.month) < minMonth;
  });
  const nextDisabled = $derived.by(() => {
    if (maxMonth === undefined) return false;
    const next = addMonths(view.year, view.month, 1);
    return monthKey(next.year, next.month) > maxMonth;
  });

  function monthOptionDisabled(month: number): boolean {
    const key = monthKey(view.year, month);
    return (
      (minMonth !== undefined && key < minMonth) ||
      (maxMonth !== undefined && key > maxMonth)
    );
  }

  let panel = $state<HTMLElement>();

  function navigate(deltaMonths: number) {
    const next = addMonths(view.year, view.month, deltaMonths);
    // Clamp the day-of-month into the target month (Jan 31 → Feb 28).
    const day = Math.min(activeParts.day, daysInMonth(next.year, next.month));
    active = clampIso(formatIsoDate(next.year, next.month, day));
  }

  function moveActive(deltaDays: number) {
    // One-shot construction: Date.UTC normalizes out-of-range days, and an
    // unmutated Date keeps the svelte-reactivity lint honest.
    const date = new Date(
      Date.UTC(
        activeParts.year,
        activeParts.month - 1,
        activeParts.day + deltaDays,
      ),
    );
    active = clampIso(
      formatIsoDate(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
      ),
    );
  }

  function select(iso: string, disabled: boolean) {
    if (disabled) return;
    active = iso;
    value = iso;
    onselect?.(iso);
  }

  function onkeydown(event: KeyboardEvent) {
    const weekday = ((new Date(active + "T00:00:00Z").getUTCDay() + 6) % 7) + 1;
    const intoWeek = (weekday - weekStart + 7) % 7;

    const handlers: Record<string, () => void> = {
      ArrowLeft: () => moveActive(-1),
      ArrowRight: () => moveActive(1),
      ArrowUp: () => moveActive(-7),
      ArrowDown: () => moveActive(7),
      Home: () => moveActive(-intoWeek),
      End: () => moveActive(6 - intoWeek),
      PageUp: () => navigate(event.shiftKey ? -12 : -1),
      PageDown: () => navigate(event.shiftKey ? 12 : 1),
    };

    const handler = handlers[event.key];
    if (!handler) return;
    event.preventDefault();
    handler();
    focusActive();
  }

  // Focus follows the roving tabindex after keyboard navigation — including
  // across month flips, where the button is a NEW element.
  function focusActive() {
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
      title={config.labels.calendar.previousMonth}
      disabled={previousDisabled}
      onclick={() => navigate(-1)}
    >
      <ChevronLeftIcon class="size-4" aria-hidden="true" />
      <span class="sr-only">{config.labels.calendar.previousMonth}</span>
    </button>
    <!-- Month/year dropdowns: going back 3 years and 5 months should be
         two picks, not 41 clicks. The chevrons stay for single steps. -->
    <div class="flex items-center gap-0.5">
      <select
        class={coreTheme.calendar.headerSelect}
        aria-label={config.labels.calendar.month}
        value={view.month}
        onchange={(event) =>
          jumpTo(view.year, Number(event.currentTarget.value))}
      >
        {#each months as name, index (index)}
          <option value={index + 1} disabled={monthOptionDisabled(index + 1)}>
            {name}
          </option>
        {/each}
      </select>
      <select
        class={coreTheme.calendar.headerSelect}
        aria-label={config.labels.calendar.year}
        value={view.year}
        onchange={(event) =>
          jumpTo(Number(event.currentTarget.value), view.month)}
      >
        {#each years as year (year)}
          <option value={year}>{year}</option>
        {/each}
      </select>
    </div>
    <button
      type="button"
      class={coreTheme.calendar.navButton}
      title={config.labels.calendar.nextMonth}
      disabled={nextDisabled}
      onclick={() => navigate(1)}
    >
      <ChevronRightIcon class="size-4" aria-hidden="true" />
      <span class="sr-only">{config.labels.calendar.nextMonth}</span>
    </button>
  </div>

  <!-- tabindex -1: the composite is programmatically focusable; the tab
       stop is the roving-tabindex active cell. -->
  <div
    role="grid"
    tabindex={-1}
    aria-label={title}
    class="mt-1 grid gap-y-0.5"
    style="grid-template-columns: {showWeekNumbers
      ? 'auto repeat(7, minmax(0, 1fr))'
      : 'repeat(7, minmax(0, 1fr))'}"
    {onkeydown}
  >
    <div role="row" class="col-span-full grid grid-cols-subgrid">
      {#if showWeekNumbers}
        <div role="columnheader" class={coreTheme.calendar.weekNumberLabel}>
          <span aria-hidden="true">{config.labels.calendar.week}</span>
        </div>
      {/if}
      {#each weekdays as name, index (index)}
        <div role="columnheader" class={coreTheme.calendar.weekdayLabel}>
          {name}
        </div>
      {/each}
    </div>

    {#each grid.weeks as week (week.weekYear * 100 + week.week)}
      <div role="row" class="col-span-full grid grid-cols-subgrid">
        {#if showWeekNumbers}
          <div
            role="rowheader"
            class={cn(
              coreTheme.calendar.weekNumberLabel,
              "content-center tabular-nums",
            )}
          >
            {week.week}
          </div>
        {/if}
        {#each week.days as day (day.iso)}
          <!-- The button IS the gridcell: aria-selected belongs on the
               cell role, and the cell is the focusable widget (APG). -->
          <button
            type="button"
            role="gridcell"
            data-iso={day.iso}
            tabindex={day.iso === active ? 0 : -1}
            disabled={day.disabled}
            aria-selected={day.iso === value}
            aria-current={day.today ? "date" : undefined}
            aria-label={dayLabelFormat.format(new Date(day.iso + "T00:00:00Z"))}
            class={cn(
              coreTheme.calendar.cell,
              "size-8 tabular-nums",
              day.outside && coreTheme.calendar.cellOutside,
              day.today && coreTheme.calendar.cellToday,
              day.iso === value && coreTheme.calendar.cellSelected,
            )}
            onclick={() => select(day.iso, day.disabled)}
          >
            {day.day}
          </button>
        {/each}
      </div>
    {/each}
  </div>
</div>
