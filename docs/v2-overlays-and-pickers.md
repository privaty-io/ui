# v2: Overlay primitives → cross-browser pickers

The v2 headline (cross-browser date/month picker — Firefox has no native
`month`/`week` pickers) built ground-up as layered primitives, so ranges,
searchable selects, and rich selects come cheap later.

## Decisions (settled 2026-08-28, don't re-litigate)

- **Positioning: hand-rolled mini engine, PUBLIC core API.** Measure, flip,
  shift, offset — no dependency. Designed as an exported primitive so
  consumers can position their own content with it, not an internal util.
  CSS anchor positioning can replace internals once baseline (Firefox
  lacked it at planning time — verify at build). Build outcome: it IS
  baseline (Firefox 147+); `anchorTo` shipped dual-engine — native where
  a CSS.supports detect passes, the JS engine as the fallback.
- **Always the custom picker.** Native pickers are suppressed everywhere,
  even where good (Chrome) — one Privaty-branded experience in every
  browser is the point (visual identity). Typed entry stays available.
  Build outcome, two exceptions: Firefox draws an unhideable calendar
  icon on `type="date"` (Bugzilla 1830890), so there the native
  affordance wins for dates; and the native-input carriers keep native
  MOBILE pickers on purpose.
- **Native-first for everything else**: the `popover` attribute provides
  top layer + light dismiss (no z-index/overflow fights — matters inside
  the table's sticky/scrollport world). `popover="hint"` for tooltips where
  supported; the spec's invalid-value fallback is `manual`, which is fine
  because tooltip visibility is driven by our hover/focus logic anyway.
- **Tooltip ≠ popover.** Tooltip: hover/focus, non-interactive,
  `role="tooltip"` + `aria-describedby`, never focused. Popover: click,
  interactive, focus management, Escape/light dismiss, `aria-expanded` on
  the trigger. Two components sharing the rendering machinery.
- **Core/forms split unchanged**: presentational pickers in `@privaty/ui`
  (Kit-free, ISO string values in/out), field-wired wrappers in
  `@privaty/ui-forms` (the existing `Input` ← `TextInput` pattern).
- **The ISO contract does not change.** Pickers speak the same strings the
  native inputs submit (`YYYY-MM-DD`, `YYYY-MM`, `YYYY-Www`, `HH:mm`) — no
  server/schema changes. Kit reads live FormData, so a real `<input>`
  always carries name/value; the picker augments it.
- **Test rig**: add a Firefox vitest-browser instance SCOPED to the
  overlay/picker specs (the fallback path gets coverage in the browser that
  motivated the feature). Parked for later: evaluate Firefox for the whole
  suite, and eventually WebKit.

## Milestones

1. **Positioning engine** (core, public): anchor + placement
   (side × alignment), flip order, shift-into-viewport, offset; updates on
   scroll/resize (listeners + ResizeObserver, no polling).
2. **Popover + Tooltip primitives** (core): built on `popover` attribute +
   the engine. Dogfood immediately: upgrade the table's header tooltips and
   icon-button `title`s.
3. **Calendar engine** (core, headless): Intl-based month matrix, locale
   month/weekday names + first day of week, ISO week numbers (Danish
   convention and `type="week"` semantics), min/max + disabled-dates hook.
   Locale likely joins UiConfig.
4. **Presentational pickers** (core): DatePicker (ARIA grid, roving
   tabindex, full keyboard nav), MonthPicker, WeekPicker; TimePicker after.
5. **Forms wrappers**: DatePickerInput / MonthPickerInput / … — decide at
   build whether the visible input carries the ISO value directly or a
   display format with a hidden ISO input (FormData constraint above).
6. **Ranges** (date range first — one component binding two field slices),
   then **searchable select** (ARIA combobox — hardest a11y widget, its own
   round) and **rich selects** with previews (shape it so Chrome's
   customizable `<select>` / `appearance: base-select` can take over once
   cross-browser).

## Verify at build time (never from memory)

- `popover="hint"` support status (Firefox especially) + invalid-value →
  `manual` fallback behavior.
- CSS anchor positioning status in Firefox (may simplify the engine).
- Customizable `<select>` (`<selectedcontent>`) status.
- `Intl.Locale.prototype.getWeekInfo()` availability for first-day-of-week.
