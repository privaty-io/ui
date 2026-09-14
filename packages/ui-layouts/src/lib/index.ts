/**
 * Root barrel for `@privaty/ui-layouts` — the package's ONLY public
 * module. Folder layout below is internal and free to change; bundlers
 * tree-shake the barrel.
 *
 * The architecture rule: every layout here is composed of CORE
 * components only (tiles, controls, theming) — never forms, never
 * tables (enforced by lint).
 *
 * Composition model: `Frame` is the app column; `Header`/`Footer` are
 * root-layout furniture inside it; each route renders one page
 * scaffold (`Page`, `SidebarPage`, `CenteredPage`, `ListDetail`) that
 * fills the leftover space.
 */

// The frame and its furniture
export { default as Frame } from "./frame.svelte";
export { default as Header } from "./header.svelte";
export { default as Footer } from "./footer.svelte";

// Navigation pieces
export { default as HeaderNav } from "./nav/header-nav.svelte";
export { default as NavList } from "./nav/nav-list.svelte";
export { default as NavItem } from "./nav/nav-item.svelte";
export { getNavContext, setNavContext } from "./nav/context";
export type { NavContext } from "./nav/context";

// Page scaffolds
export { default as Page } from "./page.svelte";
export { default as SidebarPage } from "./sidebar-page/sidebar-page.svelte";
export type { SidebarNavContext } from "./sidebar-page/sidebar-page.svelte";
export { default as CenteredPage } from "./centered-page.svelte";
export type { CenteredPageWidth } from "./centered-page.svelte";
export { default as ListDetail } from "./list-detail.svelte";

// Theming
export { layoutsTheme } from "./theme";
