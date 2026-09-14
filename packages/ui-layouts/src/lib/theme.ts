import { cn } from "@privaty/ui";

/**
 * The layouts' visual skin — everything the composable layouts add ON
 * TOP of the core tiles: bar arrangement, nav-item states, the quiet
 * fine-print typography. Structure (splits, tracks, landmarks) stays in
 * the components; restyling the layouts means editing this file. The
 * tiles themselves are skinned by `coreTheme.tiles` — nothing here
 * repeats those tokens.
 */
const layoutsTheme = {
  /** Viewport sizing every page scaffold carries: fill a Frame's
   * leftover column space (`flex-1`) or a bounded container (`h-full`),
   * shrink allowed. The basis-0 + min-h-0 pair is what pins the
   * scaffold to ONE screen even in a growing (`min-h-svh`) Frame —
   * content contributes no intrinsic height and scrolls inside. */
  pageRoot: "min-h-0 min-w-0 h-full flex-1",
  /** Document-flow sizing (Page's `flow`): the scaffold grows WITH its
   * content, so the page itself scrolls and the Frame's footer trails
   * the content — pair with a growing Frame (`min-h-svh`). */
  pageFlow: "min-w-0 w-full grow",

  /** Header — a tile row: brand left, free middle, actions docked. */
  header: {
    root: "flex items-center gap-4",
    brand: "flex items-baseline gap-2 whitespace-nowrap",
    title: "text-sm font-semibold tracking-wide",
    subtitle: "text-xs text-stone-500",
    actions: "ml-auto flex items-center gap-2",
  },

  /** Footer — a still tile row of quiet fine print with an end dock. */
  footer: {
    root: "flex items-center gap-4 py-2 text-xs text-stone-500",
    end: "ml-auto flex items-center gap-1.5",
  },

  nav: {
    /** HeaderNav: a horizontal run of NavItems. */
    headerNav: "flex items-center gap-1 text-sm",
    /** NavList's scrolling stack of items (the footer stays below it). */
    items: "flex min-h-0 grow flex-col gap-1 overflow-y-auto",
    /** NavList's bottom-docked footer line (signed-in state, version). */
    footer: cn(
      "mt-2 shrink-0 border-t pt-2",
      "border-stone-300/60 text-xs whitespace-nowrap text-stone-500",
      "dark:border-stone-800",
    ),
    /** Every nav entry — a ghost Button/Link aligned like a list row. */
    item: "justify-start px-2 whitespace-nowrap",
    /** The current entry keeps the ghost hover wash at rest. */
    itemCurrent: "bg-stone-200/70 font-medium dark:bg-stone-800",
    /** Compact (icon-rail) state: the icon centers, the label hides. */
    itemCompact: "justify-center px-0",
  },

  /** Page's wrapped main tile — the route's one scrolling region. */
  page: {
    main: "overflow-y-auto",
  },

  sidebar: {
    /** The nav pane: a column a NavList fills top to bottom. */
    navPane: "flex h-full flex-col text-sm",
  },

  centered: {
    /** Centers the one card in both axes (the canvas comes from the
     * Frame or TileCanvas behind). */
    root: "grid place-items-center",
    /** The width-capped column holding the card and its footer line. */
    frame: "flex w-full flex-col items-center gap-3",
    /** The card itself. A lone card earns more inset than a dense pane —
     * the padding override is deliberate. */
    panel: "w-full p-4",
    /** The quiet line under the card (a sign-up link, legal print). */
    footer: "text-center text-xs text-stone-500",
  },

  listDetail: {
    /** Both panes: full-height scrolling tiles. */
    pane: "h-full overflow-y-auto",
  },
};

export { layoutsTheme };
