# @privaty/ui

Core building blocks shared by `@privaty/ui-forms` and `@privaty/ui-tables`:
the base controls (Input, Textarea, Select, Checkbox, Button, Spinner,
FieldFrame), the `cn()` class merger, and the configuration contexts.

```bash
pnpm add @privaty/ui
```

> Pre-1.0 until SvelteKit 3 is stable — all `@privaty/*` packages version in
> lockstep, so install matching versions.

Every export is also available from the package root — `import { Button,
Tooltip, cn } from "@privaty/ui"` — alongside the deep subpaths shown
throughout this README; both tree-shake.

## Requirements

- **Tailwind CSS v4** is a hard dependency. Once packaged, consumers must add
  the package sources to their content scan:

  ```css
  @import "tailwindcss";
  @source "../node_modules/@privaty/ui";
  ```

- **Dark mode** uses the `dark:` variant — works with Tailwind's default
  `prefers-color-scheme` handling or a custom variant (e.g.
  `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`).

- **Single instance, always.** The configuration contexts key on private
  `Symbol`s: `@privaty/ui` MUST be a `peerDependency` of the forms/tables
  packages so exactly one copy exists. Two copies mean two symbol identities
  and silently broken context.

The controls are **self-sufficient**: they carry their own border widths,
`appearance` resets, and the select chevron. No `@tailwindcss/forms` (or any
other plugin) is required — or expected. `components/control-chrome.svelte.test.ts`
guards this.

## Configuration

`setUiConfig(partial)` provides labels and message resolution to everything
below it via context; `getUiConfig()` falls back to English defaults.

- `resolveMessage(issue)` supports the validator-code pattern: use short
  codes as schema messages (`"required"`, `"too-long"`) and translate them in
  one place. Plain messages pass through untouched.
- `labels.form` / `labels.table` hold every built-in string (markers, button
  labels, empty state) — overridable per subtree.

`setUiDensity({ get density() { ... } })` / `getUiDensity()` carry the
ambient density (`"comfortable" | "compact"`); controls size themselves from
it (a compact table compacts its editor inputs automatically). Provide it
with a getter so changes propagate.

## Theming

- Per-instance: every component takes `class` plus targeted overrides
  (`labelClass`, `inputClass`, `errorClass`, …) merged last via `cn()`.
- Library-wide: the visual skin lives in **`theme.ts`** (`coreTheme`) —
  colors, padding, chrome — separated from structural mechanics in the
  components. Note: Tailwind's scanner only sees literal class strings;
  never build class names at runtime.
- Focus is a custom `:focus-visible` outline on every control — the native
  ring differs per engine (near-invisible in Chromium/Edge against this
  palette). `coreTheme.focusRing` is public: put it on your own focusable
  elements (a Popover trigger, a link) to match.

## Calendar pickers

Cross-browser `DatePicker`, `MonthPicker`, and `WeekPicker` — the custom
replacements for the native inputs Firefox never got (`type="month"`,
`type="week"`), valued in exactly the strings those inputs submit
("YYYY-MM-DD", "YYYY-MM", "YYYY-Www").

- Presentational and Kit-free: bind `value` (or `onselect` — close a
  hosting Popover there); the forms wrappers come separately.
- Header month/year dropdowns jump anywhere in two picks (range follows
  min/max, otherwise a century each way); the chevrons step singly.
- Keyboard-first ARIA composites with roving tabindex: arrows move by
  day/week/month, PageUp/PageDown by month or year (Shift for years in
  DatePicker), Home/End, Enter/Space. Date/Month are `role="grid"`
  (buttons ARE the gridcells), Week is a `role="listbox"` of whole-week
  rows.
- `min`/`max` (inclusive, ISO strings), `isDateDisabled` hook
  (DatePicker), `showWeekNumbers` (DatePicker), `aria-current="date"` for
  today (DatePicker, MonthPicker).
- Locale: the `locale` prop, else `UiConfig.locale`, else the runtime —
  names AND first day of week follow it (WeekPicker is always
  Monday-first: ISO weeks are only well-defined that way). Labels come
  from `labels.calendar`.
- Specs run in Chromium AND Firefox — the browser these exist for.

## Calendar engine

`calendar/calendar.js` is the headless layer the pickers
build on — pure math + Intl, no DOM, no state, values in the same ISO
strings the native inputs submit.

- `calendarMonth(year, month, options)` lays a month out as weeks of
  `CalendarDay`s (outside/today/disabled flagged; min/max as inclusive ISO
  bounds — lexicographic comparison, no Date churn; `isDateDisabled` hook;
  `fixedWeeks` for stable 6-row pickers). Every row carries its ISO-8601
  week identity (`week`, `weekYear`) — the Danish and `type="week"`
  convention, Thursday rule included.
- `monthNames` / `weekdayNames` (rotated to any week start) /
  `firstDayOfWeek` come from Intl — Denmark says Monday, en-US says
  Sunday. `UiConfig.locale` is the intended source of the locale tag;
  undefined uses the runtime's default.
- `parseIsoDate` (strict — rejects 2026-02-30), `formatIsoDate`,
  `isoWeek`/`formatIsoWeek` ("2026-W05"), `addMonths`, `daysInMonth`.
- Months are 1-based everywhere; weekdays are ISO (Mon=1 … Sun=7);
  supported years are 0100–9999 (see the engine's module note).

## Overlays

`overlays/` is the top-layer toolkit: `Popover` and `Tooltip` components on
the native popover attribute, and the positioning primitive they share.

- **`Popover`** — interactive overlay: native light dismiss + Escape, a
  `trigger` snippet whose props you spread onto a `<button>` (the native
  invoker), `bind:open` for programmatic control (e.g. close on select).
- **`Tooltip`** — hover/focus label: `role="tooltip"` + `aria-describedby`
  wired, `popover="hint"` (degrades to `manual` where unsupported — same
  behavior, visibility is library-driven), non-interactive by contract
  (pointer-events off; keep interactive content in a Popover). Hover waits
  `openDelay` (default 300 ms); keyboard focus shows immediately.
- Both position via `anchorTo` and accept `placement`/`offset` etc.
- Overlay specs run in Chromium AND Firefox (the browser that motivated
  this layer) — the `overlays-firefox` vitest project.

### Positioning

`overlays/position.js` exports the anchored-positioning primitive the
overlays are built on — public, so consumer content can use it too:

```svelte
<script>
  import { anchorTo } from "@privaty/ui/overlays/position.js";
  let anchor = $state();
</script>

<button bind:this={anchor}>Open</button>
<menu {@attach anchorTo(anchor, { placement: "bottom-start", offset: 4 })}>
  …
</menu>
```

- 12 placements (`side` × optional `start`/`end` alignment), `offset`,
  viewport-aware `flip` and `shift` with `padding` — the applied placement
  lands on the element as `data-placement` (arrows, transform-origin).
- Dual-engine: where the browser has CSS anchor positioning (Baseline
  2026 — Chrome 125+, Firefox 147+, Safari 18.2+) the compositor tracks the
  anchor, so the element follows scrolling with zero lag and no JS listeners;
  everywhere else a JS engine repositions on ancestor scroll, window resize,
  and anchor/element size changes. Either way a hidden element (closed
  popover) positions itself the moment it becomes visible, and top-layer
  `[popover]` elements work.
- Engine differences, kept small: `shift`/`padding` apply only in the JS
  engine (the native one trades edge-shifting for lag-free tracking), and
  natively `flip` maps to `position-try-fallbacks` so `data-placement`
  reports the _requested_ placement there.
- `computeAnchorPosition` is the pure geometry underneath the JS engine,
  exported for custom update strategies. Hand-rolled, dependency-free.
- `engine: "native" | "js"` forces one engine instead of the automatic
  pick — a test/debug seam (the JS engine is unreachable any other way in
  browsers that support anchor positioning).
- The JS engine measures with `getBoundingClientRect` — animate transforms
  on an inner wrapper, not the positioned element itself.

## Component notes

- `FieldFrame` implements the label layouts (`top`, `left`, `floating`,
  `hidden`) and the error list (`aria-live="polite"`). Floating labels are
  input-only (they rely on `:placeholder-shown`).
- `Select` renders a lucide chevron overlaid on an `appearance-none` select;
  `defaultValue` marks the matching option `selected` so a native form reset
  returns to it.
- `Checkbox` binds `checked`, styles via native `accent-color`, and forwards
  `defaultChecked` (native reset support).
- `Button` has `primary`/`secondary` variants; hover/active are gated on
  `enabled:` everywhere — follow that convention in overrides.
