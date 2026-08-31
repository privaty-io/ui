import { cn } from "./cn";

/**
 * The core controls' visual skin — colors, padding, chrome. Structure and
 * accessibility mechanics (peer/floating wiring, sr-only, bindings) stay in
 * the components.
 *
 * SELF-SUFFICIENT ON PURPOSE: controls carry their own border width,
 * appearance reset, and select chevron — they must not rely on app-level
 * plugins like `@tailwindcss/forms` (published packages land in apps that
 * don't have it).
 */
/** One focus ring for every browser: the native `:focus-visible` ring is a
 * lottery (barely visible in Chromium/Edge against this palette, fine in
 * Firefox), so every focusable control composes this instead. An OUTLINE on
 * purpose — no layout shift, follows the border-radius, and survives
 * forced-colors mode where box-shadow rings are stripped. The offset gap
 * keeps it legible even on same-colored surfaces (a selected calendar
 * cell). Author styles beat the UA ring, so nothing else to suppress. */
const focusRing = cn(
  "focus-visible:outline-2 focus-visible:outline-offset-1",
  "focus-visible:outline-stone-800 dark:focus-visible:outline-stone-200",
);

const coreTheme = {
  /** The shared cross-browser focus ring (see above) — public so consumer
   * elements (a Popover trigger, a custom button) can match the controls. */
  focusRing,

  /** Shared box chrome for input, textarea, and select. scheme-*: native
   * widget parts (a select's OPTION POPUP, number spinners) are painted by
   * the browser from the element's color-scheme — without this, a host app
   * that never sets color-scheme (e.g. system-preference dark without a
   * data-theme attribute) gets light popups under dark text. */
  controlBase: cn(
    "w-full appearance-none rounded border px-2 scheme-light dark:scheme-dark",
    focusRing,
  ),
  /** Neutral stone surface, border, and placeholder colors for the box
   * controls, with focus/hover/active/disabled states in light and dark. */
  controlSurface: cn(
    "bg-stone-200/25 focus:bg-stone-200/50 enabled:hover:bg-stone-200/75 enabled:active:bg-stone-200/25 disabled:bg-stone-200/10",
    "border-stone-400 placeholder:text-stone-600 disabled:border-stone-400/50 disabled:text-stone-600",
    "dark:bg-stone-800/25 dark:focus:bg-stone-800/50 dark:enabled:hover:bg-stone-800/75 dark:enabled:active:bg-stone-800/25 dark:disabled:bg-stone-800/10",
    "dark:border-stone-600 dark:placeholder:text-stone-400 dark:disabled:border-stone-600/50 dark:disabled:text-stone-400",
  ),
  /** Vertical rhythm per density (the ambient density context selects). */
  controlPadding: { comfortable: "py-1.5", compact: "py-0.5 text-sm" },

  /** Select-only box chrome: pointer + room for the overlaid chevron
   * (appearance-none removes the native arrow; `peer` links the chevron's
   * disabled styling). */
  select: cn(
    "peer cursor-pointer pr-8 disabled:cursor-not-allowed",
    // Firefox paints the option POPUP from the select's/options' background
    // colors, not color-scheme (that covers Chromium) — a transparent-ish
    // select means a white popup under dark text without these.
    "[&>option]:bg-stone-50 [&>option]:text-stone-800",
    "dark:[&>option]:bg-stone-950 dark:[&>option]:text-stone-200",
  ),
  /** An interactive adornment button overlaid on a control's inline end
   * (the picker inputs' calendar trigger) — pair it with `pr-8` on the
   * control so text never runs beneath it. */
  controlTrigger: cn(
    "absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer rounded p-1",
    "text-stone-600 enabled:hover:bg-stone-200 enabled:hover:text-stone-800",
    "dark:text-stone-400 dark:enabled:hover:bg-stone-800 dark:enabled:hover:text-stone-200",
    "disabled:cursor-not-allowed disabled:opacity-40",
    focusRing,
  ),

  /** The lucide chevron overlaid on the select — pointer-events-none so
   * clicks land on the control; colored via text utilities (a real icon,
   * unlike a background-image, follows the theme). */
  selectChevron: cn(
    "pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2",
    "text-stone-600 peer-disabled:text-stone-600/50",
    "dark:text-stone-400 dark:peer-disabled:text-stone-400/50",
  ),

  checkbox: {
    /** The native checkbox itself — colored via accent-color so the check
     * follows the theme without replacing the native control. */
    box: cn(
      "size-4 cursor-pointer disabled:cursor-not-allowed",
      "accent-stone-800 dark:accent-stone-200",
      focusRing,
    ),
    /** The clickable label text next to the box. */
    label: "cursor-pointer text-stone-600 dark:text-stone-400",
  },

  calendar: {
    /** The picker panel itself — chrome-free so it can sit inside a
     * Popover (which brings its own) or stand alone. */
    panel: "select-none",
    /** The month/year (or year) heading. */
    title: "text-sm font-medium",
    /** The header's month/year dropdowns — compact, native arrow kept.
     * scheme-*: see controlBase — the option popup follows the theme. */
    headerSelect: cn(
      "scheme-light dark:scheme-dark",
      "cursor-pointer rounded bg-transparent px-1 py-0.5 text-sm font-medium",
      "hover:bg-stone-200 dark:hover:bg-stone-800",
      focusRing,
      // See coreTheme.select: Firefox popups need explicit option colors.
      "[&>option]:bg-stone-50 [&>option]:text-stone-800",
      "dark:[&>option]:bg-stone-950 dark:[&>option]:text-stone-200",
    ),
    /** The prev/next navigation buttons framing the heading. */
    navButton: cn(
      "cursor-pointer rounded p-1",
      "enabled:hover:bg-stone-200 dark:enabled:hover:bg-stone-800",
      "disabled:cursor-not-allowed disabled:opacity-40",
      focusRing,
    ),
    /** Weekday initials above the grid. */
    weekdayLabel: "text-center text-xs text-stone-500",
    /** The ISO week-number column (showWeekNumbers). */
    weekNumberLabel: "pr-1 text-right text-xs text-stone-500",
    /** Every selectable cell: days, months, and week rows share this. */
    cell: cn(
      "cursor-pointer rounded text-center text-sm",
      "enabled:hover:bg-stone-200 dark:enabled:hover:bg-stone-800",
      "disabled:cursor-not-allowed disabled:opacity-40",
      focusRing,
    ),
    /** Days rendered from a neighbouring month. */
    cellOutside: "text-stone-400 dark:text-stone-600",
    /** Today's marker — kept subtle next to the selected state. */
    cellToday: "font-semibold underline underline-offset-4",
    /** The chosen day/month/week. */
    cellSelected: cn(
      "bg-stone-800 text-stone-50 enabled:hover:bg-stone-700",
      "dark:bg-stone-200 dark:text-stone-900 dark:enabled:hover:bg-stone-300",
    ),
  },

  /** Popover panel: an opaque bordered surface floating on the top layer. */
  popover: cn(
    "rounded border p-3 shadow-lg",
    "border-stone-400 bg-stone-50 text-stone-800",
    "dark:border-stone-600 dark:bg-stone-950 dark:text-stone-200",
  ),
  /** Tooltip bubble: compact inverse surface. pointer-events-none is part
   * of the contract — tooltips are never interactive, and a hoverable
   * bubble would flicker against its own trigger. */
  tooltip: cn(
    "pointer-events-none rounded px-2 py-1 text-xs shadow-md",
    "bg-stone-800 text-stone-50",
    "dark:bg-stone-200 dark:text-stone-900",
  ),

  button: {
    /** Chrome shared by both variants — sizing, radius, cursor. */
    base: cn(
      "cursor-pointer rounded px-3 py-1.5 disabled:cursor-not-allowed",
      focusRing,
    ),
    /** Filled high-contrast variant. */
    primary: cn(
      "bg-stone-800 text-stone-50 enabled:hover:bg-stone-700 enabled:active:bg-stone-800",
      "disabled:bg-stone-800/50",
      "dark:bg-stone-200 dark:text-stone-900 dark:enabled:hover:bg-stone-300 dark:enabled:active:bg-stone-200",
      "dark:disabled:bg-stone-200/50",
    ),
    /** Outlined transparent variant. */
    secondary: cn(
      "border border-stone-400 bg-transparent text-inherit enabled:hover:bg-stone-200/50 enabled:active:bg-transparent",
      "disabled:border-stone-400/50 disabled:text-stone-500",
      "dark:border-stone-600 dark:bg-transparent dark:enabled:hover:bg-stone-800/50 dark:enabled:active:bg-transparent",
      "dark:disabled:border-stone-600/50 dark:disabled:text-stone-400",
    ),
  },

  field: {
    /** The field's label text. */
    label: "text-nowrap text-stone-600 dark:text-stone-400",
    /** The required/optional minority marker beside the label. */
    marker: "text-xs",
    /** Validation error text. */
    error: "text-sm text-red-700 dark:text-red-500",
  },
};

export { coreTheme };
