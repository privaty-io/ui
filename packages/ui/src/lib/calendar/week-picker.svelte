<!-- @component
Cross-browser week picker — the replacement for `type="week"` where the
browser has none (Firefox). Renders a month of ISO weeks as a listbox of
selectable rows, valued as the native input's "YYYY-Www" strings (ISO-8601
weeks, the Danish convention). Presentational and Kit-free: bind `value`
or use `onselect`. Keyboard: Up/Down move between weeks, PageUp/PageDown
by month, Enter/Space select. Weeks always run Monday-first — ISO week
identity is only well-defined that way.
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
    formatIsoDate,
    formatIsoWeek,
    isoWeek,
    monthNames,
    parseIsoDate,
    weekdayNames,
    type CalendarWeek,
  } from "./calendar";

  interface Props {
    /** Selected week as "YYYY-Www" (bindable); "" = nothing selected. */
    value?: string;
    /** Fires with the ISO week on every pick. */
    onselect?: (iso: string) => void;

    /** Inclusive "YYYY-Www" bounds; weeks outside become disabled. */
    min?: string;
    max?: string;

    /** BCP 47 tag for names — overrides `UiConfig.locale`. */
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
  const weekdays = $derived(weekdayNames(resolvedLocale, "narrow", 1));

  const now = new Date();
  const todayIso = formatIsoDate(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );

  // The displayed month. A week value doesn't name a month directly — the
  // view starts at today (or the month containing the bound week's
  // Thursday, resolved lazily on external changes).
  let view = $state({ year: 0, month: 0 });
  view = initialView();

  function initialView(): { year: number; month: number } {
    const today = parseIsoDate(todayIso)!;
    const match = /^(\d{4})-W(\d{2})$/.exec(value);
    if (!match) return { year: today.year, month: today.month };

    // The Thursday of week N of year Y: Jan 4 is always in week 1. Two
    // immutable Dates — Date.UTC normalizes the day overflow.
    const jan4 = new Date(Date.UTC(Number(match[1]), 0, 4));
    const thursday = new Date(
      Date.UTC(
        Number(match[1]),
        0,
        4 - ((jan4.getUTCDay() + 6) % 7) + 3 + (Number(match[2]) - 1) * 7,
      ),
    );
    return {
      year: thursday.getUTCFullYear(),
      month: thursday.getUTCMonth() + 1,
    };
  }

  const grid = $derived(
    calendarMonth(view.year, view.month, {
      firstDayOfWeek: 1,
      today: todayIso,
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

  const isoOf = (week: CalendarWeek) => formatIsoWeek(week.weekYear, week.week);

  const months = $derived(monthNames(resolvedLocale));

  // The month containing a week's Thursday — the boundary views min/max
  // clamp navigation to.
  function weekViewOf(
    iso: string,
  ): { year: number; month: number; key: number } | undefined {
    const match = /^(\d{4})-W(\d{2})$/.exec(iso);
    if (!match) return undefined;
    const jan4 = new Date(Date.UTC(Number(match[1]), 0, 4));
    const thursday = new Date(
      Date.UTC(
        Number(match[1]),
        0,
        4 - ((jan4.getUTCDay() + 6) % 7) + 3 + (Number(match[2]) - 1) * 7,
      ),
    );
    const year = thursday.getUTCFullYear();
    const month = thursday.getUTCMonth() + 1;
    return { year, month, key: year * 12 + month };
  }

  const minView = $derived(min !== undefined ? weekViewOf(min) : undefined);
  const maxView = $derived(max !== undefined ? weekViewOf(max) : undefined);

  const previousDisabled = $derived(
    minView !== undefined && view.year * 12 + view.month - 1 < minView.key,
  );
  const nextDisabled = $derived(
    maxView !== undefined && view.year * 12 + view.month + 1 > maxView.key,
  );

  function monthOptionDisabled(month: number): boolean {
    const key = view.year * 12 + month;
    return (
      (minView !== undefined && key < minView.key) ||
      (maxView !== undefined && key > maxView.key)
    );
  }
  // Dropdown year range — same policy as DatePicker's (weeks have no
  // min/max years worth clamping to beyond the value bounds' years).
  const years = $derived.by(() => {
    const from = min ? Number(min.slice(0, 4)) : view.year - 100;
    const to = max ? Number(max.slice(0, 4)) : view.year + 100;
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  });
  const isDisabled = (iso: string) =>
    (min !== undefined && iso < min) || (max !== undefined && iso > max);

  let panel = $state<HTMLElement>();

  // Roving tabindex among the week rows: the active week, as its ISO value.
  let active = $state("");
  active = value || "";

  // Keep the active row inside the displayed month's grid.
  $effect(() => {
    if (!grid.weeks.some((week) => isoOf(week) === active)) {
      active = isoOf(grid.weeks[0]);
    }
  });

  function navigate(deltaMonths: number) {
    const next = addMonths(view.year, view.month, deltaMonths);
    // Navigation never leaves the months containing min/max.
    const key = next.year * 12 + next.month;
    if (minView !== undefined && key < minView.key) {
      view = { year: minView.year, month: minView.month };
    } else if (maxView !== undefined && key > maxView.key) {
      view = { year: maxView.year, month: maxView.month };
    } else {
      view = next;
    }
  }

  function select(iso: string) {
    if (isDisabled(iso)) return;
    active = iso;
    value = iso;
    onselect?.(iso);
  }

  // Steps the active week by whole ISO weeks via its Thursday — grid-edge
  // logic would re-land on the SAME week at month seams (the last row of a
  // month is the first row of the next). The view follows the new week's
  // Thursday, so the grid always contains it.
  function moveWeek(delta: number) {
    const match = /^(\d{4})-W(\d{2})$/.exec(active);
    if (!match) return;

    const jan4 = new Date(Date.UTC(Number(match[1]), 0, 4));
    const thursday = new Date(
      Date.UTC(
        Number(match[1]),
        0,
        4 -
          ((jan4.getUTCDay() + 6) % 7) +
          3 +
          (Number(match[2]) - 1 + delta) * 7,
      ),
    );
    const identity = isoWeek(
      thursday.getUTCFullYear(),
      thursday.getUTCMonth() + 1,
      thursday.getUTCDate(),
    );
    let next = formatIsoWeek(identity.weekYear, identity.week);
    // Roving never leaves [min, max] — a step past a bound lands ON it.
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    const nextView = weekViewOf(next);
    if (nextView) view = { year: nextView.year, month: nextView.month };
    active = next;
  }

  function onkeydown(event: KeyboardEvent) {
    const handlers: Record<string, () => void> = {
      ArrowUp: () => moveWeek(-1),
      ArrowDown: () => moveWeek(1),
      PageUp: () => navigate(-1),
      PageDown: () => navigate(1),
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
      title={config.labels.calendar.previousMonth}
      disabled={previousDisabled}
      onclick={() => navigate(-1)}
    >
      <ChevronLeftIcon class="size-4" aria-hidden="true" />
      <span class="sr-only">{config.labels.calendar.previousMonth}</span>
    </button>
    <div class="flex items-center gap-0.5">
      <select
        class={coreTheme.calendar.headerSelect}
        aria-label={config.labels.calendar.month}
        value={view.month}
        onchange={(event) =>
          (view = {
            year: view.year,
            month: Number(event.currentTarget.value),
          })}
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
          (view = {
            year: Number(event.currentTarget.value),
            month: view.month,
          })}
      >
        {#each years as option (option)}
          <option value={option}>{option}</option>
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

  <!-- Static header row mirroring the week rows' inner grid. -->
  <div
    class="mt-1 grid grid-cols-[auto_repeat(7,minmax(0,1fr))] gap-x-0.5 px-1"
    aria-hidden="true"
  >
    <div class={cn(coreTheme.calendar.weekNumberLabel, "w-7")}>
      {config.labels.calendar.week}
    </div>
    {#each weekdays as name, index (index)}
      <div class={coreTheme.calendar.weekdayLabel}>{name}</div>
    {/each}
  </div>

  <!-- tabindex -1: see DatePicker's grid. -->
  <div
    role="listbox"
    tabindex={-1}
    aria-label={title}
    class="grid gap-y-0.5"
    {onkeydown}
  >
    {#each grid.weeks as week (week.weekYear * 100 + week.week)}
      {@const iso = isoOf(week)}
      <button
        type="button"
        role="option"
        data-iso={iso}
        tabindex={iso === active ? 0 : -1}
        disabled={isDisabled(iso)}
        aria-selected={iso === value}
        aria-label={`${week.weekYear} ${config.labels.calendar.week} ${week.week}`}
        class={cn(
          coreTheme.calendar.cell,
          "grid grid-cols-[auto_repeat(7,minmax(0,1fr))] items-center gap-x-0.5 px-1 py-1",
          iso === value && coreTheme.calendar.cellSelected,
        )}
        onclick={() => select(iso)}
      >
        <span
          class={cn(
            coreTheme.calendar.weekNumberLabel,
            "w-7 tabular-nums",
            iso === value && "text-inherit",
          )}
        >
          {week.week}
        </span>
        {#each week.days as day (day.iso)}
          <span
            class={cn(
              "text-center tabular-nums",
              day.outside && iso !== value && coreTheme.calendar.cellOutside,
              day.today && coreTheme.calendar.cellToday,
            )}
          >
            {day.day}
          </span>
        {/each}
      </button>
    {/each}
  </div>
</div>
