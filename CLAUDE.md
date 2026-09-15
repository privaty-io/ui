# privaty-io/ui

Svelte 5 component libraries — `@privaty/ui` (core), `@privaty/ui-forms`,
`@privaty/ui-tables`, `@privaty/ui-layouts` — in a turbo+pnpm monorepo
with a SvelteKit playground app that doubles as the e2e surface.
Published to npm in lockstep. This file carries the durable working
rules; session history and war stories live in session memory — keep it
that way, and shrink sections here when code starts documenting itself.

## Toolchain

- **pnpm only** — this machine has no `npm` and no `gh` CLI. Shared
  versions live in the `catalog:` in pnpm-workspace.yaml; `@sveltejs/*`
  prerelease siblings are EXACT-pinned while Kit is pinned (a floating
  `next` dist-tag against pinned siblings has broken the build before).
- Workspace layout: `packages/{ui,ui-forms,ui-tables,ui-layouts}`,
  `apps/playground`, `configs/{eslint,typescript}` (shared, private).

## The gate suite (run before declaring ANYTHING done)

In order: `pnpm format` → `pnpm check` (all turbo tasks green) →
`pnpm lint` → `pnpm test --run` → `pnpm build --force` (publint
"All good" for every package) → `pnpm e2e` **cold** (kill port 43117
first so the dev server starts fresh; both browsers must pass).
Geometry/visual work additionally gets screenshot verification in light
AND dark before review.

## Layering (lint-enforced; don't fight it, extend it)

core imports nothing above it · forms never imports tables or layouts ·
tables may use forms, never layouts · **layouts composes CORE ONLY** ·
apps import packages by name only (`@privaty/*`), never by path. New
packages get their own eslint layer guards AND bans added to the
existing ones.

## Structure conventions

- **Barrel-only exports**: each package's public API is `"."` (plus an
  explicit `./testing` where it exists). Folder layout is internal and
  free to change.
- **Siblings rule**: a file with dependent siblings (spec, fixture)
  gets a folder; self-contained files stay bare.
- **Named exports only**, no default exports (Svelte components
  excepted — re-exported named from the barrel). Types live next to
  their owner.
- Category vocabulary in core: inputs / controls / feedback / display /
  overlays / tiles / theming.

## Styling & theming

- ALL skin lives in theme files — `coreTheme`
  (packages/ui/src/lib/theme.ts), `tableTheme`, `layoutsTheme`.
  Mechanics (stickiness, z-layers, measurement, tracks) stay in
  components. A restyle should be a theme-file edit.
- The tiling language: pages are a canvas showing through tight
  gutters; tiles carry QUIET cues — hover and focus-within share one
  half-step border warm-up. Grid/inner borders must sit a step past any
  hover wash or they vanish on hovered rows.
- Theme switching is atomic (`switchTheme`): never "fix" a transition
  artifact by putting transition-colors on everything.
- Button/Link share variant tokens: interaction states are gated
  `not-disabled:`, NEVER `enabled:` (`:enabled` doesn't match anchors —
  a Link's hover dies silently). A spec pins this.
- Theme token values are tuning knobs: **specs assert via tokens**
  (`coreTheme.tiles.tilePadding`), never literal class strings. For
  multi-class tokens, loop `token.split(" ")` with `toContain`.

## Unit-test rules (vitest browser mode)

- Naming routes the project: `*.svelte.test.ts` runs in real Chromium,
  plain `*.test.ts` in node. `requireAssertions` is on.
- Renders stay mounted for the whole file — scope EVERY query to its
  own `screen.container`.
- Props sharing a name with Svelte mount options (`target`) must nest
  under `props: {}`.
- Synthetically dispatched PointerEvents do NOT reach Svelte handlers
  in this harness (keydown/dblclick do) — real-mouse gestures belong in
  e2e, and specs should say so where they skip them.
- Tailwind is NOT loaded in browser specs: class asserts are fine,
  geometry asserts need the testing stylesheet import (see the
  `*-geometry` specs).
- Fixtures export probes (`export function currentSize()`) read via
  `screen.component`.

## E2e harness (apps/playground/e2e)

- Dev server on port **43117**; kill it before a cold run. Tests run
  serially (workers: 1, shared in-memory server data); a fresh server
  means fresh seeds.
- The console-guard fixture fails any test on console errors, page
  errors, or hydration warnings — allow expected noise per-test via
  `allowedMessages`.
- **`settle(page)` before driving hydrated handlers** — SSR paints
  headings long before hydration, and un-settled clicks land on dead
  elements (CSS-only cues can even pass unhydrated).
- Route-holds on `**/_app/remote/**` only hold CLIENT-navigated loads;
  fresh loads stream data with the SSR response.
- Sample transitioning colors only after two consecutive equal samples
  (see `settledBorderColor`).
- A collapsed pane's own boundingBox never reaches 0 (border+padding
  floor) — assert collapse via the NEIGHBOR's edge.
- New pages join the warmup list (e2e/support/warmup.ts) — cold-start
  dependency discovery otherwise trips Firefox.

## Svelte/Kit rules that have bitten us (short list; details in code comments)

- `{#snippet}` declared as a direct child of a COMPONENT becomes that
  component's prop — local snippets go outside the component's tags.
- A `$bindable` default referencing another prop requires that prop to
  be destructured FIRST (`initial = 240, size = $bindable(initial)`).
- Reactive READS inside an attachment (even via a helper called there)
  become attachment dependencies — wrap measurement callbacks in
  `untrack()` or the first write re-runs the attachment (and, e.g.,
  resets scroll). Registration writes during async resume need
  `untrack()` too.
- ResizeObserver (and Svelte dimension bindings) do NOT fire for table
  rows/cells; percentage heights on table rows overflow by the natural
  content height — measure and set px instead.
- Never put `--` inside an HTML comment in a .svelte file (invalid
  HTML; breaks spec-strict highlighters) — eslint-disable reasons go on
  their own line. A literal `</script>`/`<scr` inside a script block
  ends it — assemble via `String.fromCharCode(60)`. `svelte:head` can't
  sit inside `{#if}` — put the `{#if}` inside.
- One remote-form object per `<form>` element; with `.for(key)`, every
  field must come off the SAME keyed instance.

## Release & publish

- `pnpm release <version>` (scripts/release.mjs): clean tree on main,
  gates, lockstep version bump, tag `v<version>`; then review and
  `git push --follow-tags`. CI publishes via npm trusted publishing
  (OIDC, no token) and creates the GitHub Release.
- A brand-new package cannot be first-published by CI — the recipe
  lives in .github/workflows/publish.yml.

## Working agreements

- The maintainer (Lukas) commits and releases himself — don't commit or
  push unless asked. Signal a finished, fully-gated increment with the
  words **"ready to push"**; don't declare done before the gates run.
- Screenshot-verify visual work (light + dark) before handing it over.
- Record milestones and hard-won lessons in session memory as you go.
