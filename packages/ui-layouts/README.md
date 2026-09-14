# @privaty/ui-layouts

Composable layout defaults built on the `@privaty/ui` tiling system —
not finished application layouts, but the generic pieces a final app is
composed from: a frame, headers, footers, nav pieces, and page
scaffolds.

```bash
pnpm add @privaty/ui @privaty/ui-layouts
```

> Requires `@privaty/ui` as a **peerDependency** at the same lockstep
> version, and Tailwind v4 (`@source` the package, see the core README).

Everything imports from the package root — `import { Frame, Header,
Page } from "@privaty/ui-layouts"` — which tree-shakes; there are no
deep subpaths.

**The architecture rule:** every layout here is composed of CORE
components only — tiles, controls, theming — never forms, never tables
(enforced by lint inside the repo). That keeps the layouts usable in
any app, whether or not it pulls in the heavier packages.

## The composition model

`Frame` is the application column; `Header` and `Footer` are
root-layout furniture inside it; each route renders one **page
scaffold** that fills the leftover space. In a SvelteKit app:

```svelte
<!-- +layout.svelte -->
<Frame class="min-h-svh">
  <Header title="Cellar Ops" themeToggle>
    <HeaderNav label="Site">
      <NavItem href="/inventory" current>Inventory</NavItem>
      <NavItem href="/orders">Orders</NavItem>
    </HeaderNav>
  </Header>
  {@render children()}
  <Footer>v0.7 · all systems quiet</Footer>
</Frame>

<!-- a route's +page.svelte -->
<Page>…one scrolling content tile…</Page>
```

The Frame is the ONLY canvas the layouts own — every part and scaffold
is canvas-transparent, so sections can nest their own furniture (a
second Header, a status Footer) without doubling gutters or padding.
Scaffolds default to `flex-1 min-h-0 h-full`: they fill a Frame's
leftover column or any bounded container.

## Frame furniture

- **`Frame`** — a TileCanvas as a full-height flex column. Give the
  outermost one a viewport height — `min-h-svh` is the versatile
  choice: document-flow pages (Page `flow`) grow the column so the
  page scrolls, while viewport scaffolds still pin to one screen
  (their basis-0 sizing contributes no intrinsic height).
- **`Header`** — a tile row: brand (title + quiet subtitle, or a
  `brand` snippet), free `children` in the middle, `actions` docked
  right; `themeToggle` drops the core ThemeToggle into the dock.
- **`Footer`** — a tile row of quiet fine print: `children` plus an
  `end` dock. Doubles as a status bar (give a section's its own
  `label`).

## Navigation pieces

- **`HeaderNav`** — a horizontal `<nav>` run of NavItems (the top-nav
  pattern). A menu-style nav is a later addition, once core has menu
  components.
- **`NavList`** — a vertical `<nav>` stacking NavItems with a
  bottom-docked `footer`; long lists scroll while the footer stays put.
- **`NavItem`** — a ghost `Link` (`href`) or ghost `Button`
  (`onclick`); `current` keeps the resting wash and sets
  `aria-current`; a leading `icon` snippet is what survives a compact
  nav, so give icon-bearing items a `title`.
- **`getNavContext` / `setNavContext`** — the reactive compact-state
  contract those pieces read (provided by SidebarPage; provide it
  yourself to build other compact-aware nav pieces).

## Page scaffolds

- **`Page`** — one main Tile, two scroll stances: by default it pins
  to the viewport space and content scrolls inside (the app stance);
  `flow` grows the tile with its content so the PAGE scrolls and the
  Frame's footer trails the content (the document stance). `bare`
  hands the space over raw for pages that bring their own tiles (a
  dashboard grid).
- **`SidebarPage`** — a collapsible nav pane beside the main content.
  The nav never disappears: it collapses to a **compact icon rail**
  (`navCompact` px, default 48) — drag hard past `navMin`, press Home
  on the gutter, or call the toggle — and NavItems inside go icon-only
  with their labels kept as accessible names. The `nav` snippet
  receives `{ navCollapsed, toggleNav }` for an in-pane collapse
  button; `toggleNav()` is also exported on the component instance
  (`bind:this`) for buttons living elsewhere. `navSize` is bindable for
  persistence; `bare` works like Page's.
- **`CenteredPage`** — a single card centered in the space (sign-in,
  small settings, errors). `title` renders a TileTitle, `width` caps
  the card (`"xs" | "sm" | "md" | "lg"`), `footer` is the quiet line
  under it.
- **`ListDetail`** — master–detail: a sized, resizable `list` pane and
  a `detail` pane, both labeled scrolling Tiles. `size` is bindable.

## Theming

All the skin the layouts add on top of the core tiles lives in one
exported object, `layoutsTheme` — same pattern as `coreTheme`.
Restyling the layouts means editing (or reading) that file; specs
assert against its tokens, not literals.
