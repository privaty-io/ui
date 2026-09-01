<script lang="ts">
  import {
    Button,
    DatePicker,
    MonthPicker,
    Popover,
    WeekPicker,
  } from "@privaty/ui";

  let date = $state("");
  let month = $state("");
  let week = $state("");
  let popoverDate = $state("");
  let popoverOpen = $state(false);
</script>

<main class="mx-auto flex w-full max-w-4xl flex-col gap-6 py-8">
  <h1 class="text-2xl font-medium">Calendar sandbox</h1>

  <p class="text-sm text-stone-600 dark:text-stone-400">
    The cross-browser pickers — the whole reason this adventure started: Firefox
    has no native month or week inputs. Danish locale, Monday grids, ISO week
    numbers.
  </p>

  <div class="flex flex-wrap gap-8">
    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-medium">DatePicker (week numbers, min/max)</h2>
      <div
        class="w-fit rounded border border-stone-300 p-2 dark:border-stone-700"
      >
        <DatePicker
          bind:value={date}
          locale="da"
          showWeekNumbers
          min="2025-06-05"
          max="2026-12-24"
        />
      </div>
      <p class="text-sm">value: <code>{date || "—"}</code></p>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-medium">MonthPicker</h2>
      <div
        class="w-fit rounded border border-stone-300 p-2 dark:border-stone-700"
      >
        <MonthPicker bind:value={month} locale="da" />
      </div>
      <p class="text-sm">value: <code>{month || "—"}</code></p>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-medium">WeekPicker</h2>
      <div
        class="w-fit rounded border border-stone-300 p-2 dark:border-stone-700"
      >
        <WeekPicker bind:value={week} locale="da" />
      </div>
      <p class="text-sm">value: <code>{week || "—"}</code></p>
    </section>
  </div>

  <section class="flex flex-col gap-2">
    <h2 class="text-sm font-medium">Inside a Popover (the M5 preview)</h2>
    <div class="flex items-center gap-3">
      <Popover bind:open={popoverOpen} placement="bottom-start">
        {#snippet trigger(props)}
          <Button variant="secondary" {...props}>
            {popoverDate || "Pick a date"}
          </Button>
        {/snippet}
        <DatePicker
          bind:value={popoverDate}
          locale="da"
          showWeekNumbers
          onselect={() => (popoverOpen = false)}
        />
      </Popover>
      <span class="text-sm">value: <code>{popoverDate || "—"}</code></span>
    </div>
  </section>

  <ol
    class="list-decimal space-y-1 pl-5 text-sm text-stone-600 dark:text-stone-400"
  >
    <li>Click days/months/weeks — values are the native inputs' formats.</li>
    <li>
      Keyboard: focus a cell, arrows rove (crossing a month edge flips the
      view), PageUp/PageDown per month/year, Enter selects. One tab stop per
      picker.
    </li>
    <li>Danish grids: Monday first, ISO week numbers, danish names.</li>
    <li>DatePicker: days outside Jun 5 2025 – Dec 24 2026 are disabled.</li>
    <li>
      The Popover one: opens on click, closes on pick (onselect), light dismiss
      + Escape work, glides along on scroll.
    </li>
  </ol>
</main>
