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
- Repositions on ancestor scroll, window resize, and anchor/element size
  changes; a hidden element (closed popover) positions itself the moment it
  becomes visible. Works with top-layer `[popover]` elements.
- `computeAnchorPosition` is the pure geometry underneath, exported for
  custom update strategies. Hand-rolled, dependency-free; internals may move
  to CSS anchor positioning once it's baseline (Firefox lacks it today).
- Measurement uses `getBoundingClientRect` — animate transforms on an inner
  wrapper, not the positioned element itself.

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
