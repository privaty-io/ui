import { cn } from "@privaty/ui/cn.js";

/**
 * The table's visual skin — every color, padding, radius, and scrollbar
 * style lives here. The layout and stickiness MECHANICS (sticky offsets,
 * border-separate, overflow handling, z-layers, the w-px/w-10 width tricks)
 * stay in table.svelte: restyle freely here without touching them.
 *
 * Two rules keep the mechanics working:
 * - Backgrounds must stay OPAQUE where given (header, rows, frame): pinned
 *   cells are bg-inherit and mask scrolling content with them.
 * - Padding pairs are calibrated together: editorCellPadding compensates for
 *   the core Input's own height so editor rows match display rows.
 */
const tableTheme = {
  /** Root scroll wrapper: the outer frame, rounding, and the background
   * that paints the fill region below sparse rows. */
  frame:
    "rounded border border-stone-300 bg-stone-50 dark:border-stone-700 dark:bg-stone-950",

  /** Type scale on the <table> per density. */
  type: { comfortable: "", compact: "text-sm" },

  /** Cell padding per density (headers and data cells). */
  cellPadding: { comfortable: "px-3 py-1.5", compact: "px-2 py-0.5" },
  /** Editor cells shed vertical padding so inputs keep rows level. */
  editorCellPadding: { comfortable: "py-0.5", compact: "py-0" },
  /** Width-less columns auto-size to display content — editing needs room. */
  editorCellMinWidth: "min-w-32",

  /** Grid line color; the lines themselves (bottom borders + pinned
   * boundaries) are drawn by the mechanics. */
  border: "border-stone-300 dark:border-stone-700",

  /** Sticky header background — opaque, per the rules above. */
  headerBackground: "bg-stone-100 dark:bg-stone-900",
  /** Display-row background — pinned cells inherit it as their mask. */
  rowBackground: "bg-stone-50 dark:bg-stone-950",
  /** Background for the create/edit editor rows. */
  editorRowBackground: "bg-stone-100 dark:bg-stone-900",

  /** Empty-state message color. */
  emptyText: "text-stone-500",

  /** The loading veil pinned over the visible scrollport: translucent tint
   * plus a slight blur behind the centered spinner. It intentionally keeps
   * pointer events, blocking interaction with the stale rows beneath while
   * a refresh is in flight. */
  loadingOverlay: cn(
    "flex items-center justify-center",
    "bg-stone-50/40 backdrop-blur-[2px]",
    "dark:bg-stone-950/40",
  ),
  /** The spinner centered in the loading veil. */
  loadingSpinner: "size-6",

  /** Icon sizing for every action/expander icon. */
  icon: "size-4",
  /** Padding for the square icon action buttons per density. */
  iconButton: { comfortable: "p-1.5", compact: "p-1" },
  /** Padding for the row-expander toggle per density. */
  expanderButton: { comfortable: "p-2", compact: "p-1" },

  /** Custom scrollbars (classic-scrollbar environments only). Tracks and
   * corner carry no background COLOR on purpose — transparent tracks
   * don't clip the frame's rounded corners. The corner still needs an
   * EXPLICIT transparent background: unstyled, the UA paints it solid
   * white regardless of theme (visible whenever both scrollbars show). */
  scrollbar: cn(
    "[scrollbar-color:auto]!",
    "[&::-webkit-scrollbar]:size-2.5",
    "[&::-webkit-scrollbar-corner]:bg-transparent",
    "[&::-webkit-scrollbar-track]:border-stone-300 dark:[&::-webkit-scrollbar-track]:border-stone-700",
    "[&::-webkit-scrollbar-track:vertical]:border-l",
    "[&::-webkit-scrollbar-track:horizontal]:border-t",
    "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding",
    // Asymmetric thumb insets on purpose: the track border eats 1px of the
    // inset on the content side, so the non-bordered sides and the bar ends
    // drop to 1px too — every VISIBLE gap ends up a uniform 1px.
    "[&::-webkit-scrollbar-thumb:vertical]:border-y [&::-webkit-scrollbar-thumb:vertical]:border-r [&::-webkit-scrollbar-thumb:vertical]:border-l-2",
    "[&::-webkit-scrollbar-thumb:horizontal]:border-x [&::-webkit-scrollbar-thumb:horizontal]:border-t-2 [&::-webkit-scrollbar-thumb:horizontal]:border-b",
    "[&::-webkit-scrollbar-thumb]:bg-stone-400 dark:[&::-webkit-scrollbar-thumb]:bg-stone-600",
    "[&::-webkit-scrollbar-thumb:hover]:bg-stone-500 dark:[&::-webkit-scrollbar-thumb:hover]:bg-stone-500",
  ),
};

export { tableTheme };
