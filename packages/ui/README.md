# @privaty/ui

Core building blocks shared by `@privaty/ui-forms` and `@privaty/ui-tables`:
the base controls (Input, Textarea, Select, Checkbox, Button, Spinner,
FieldFrame), the `cn()` class merger, and the configuration contexts.

> **Not yet published** — currently consumed in-repo via the `@privaty/ui/*`
> subpath imports.

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
