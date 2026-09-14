import { cn } from "./cn/cn";

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
    "w-full appearance-none rounded-md border px-2 scheme-light dark:scheme-dark",
    "transition-colors duration-150",
    focusRing,
  ),
  /** Neutral stone surface, border, and placeholder colors for the box
   * controls, with focus/hover/active/disabled states in light and dark. */
  /** The tiling state language, applied to controls: a hairline border
   * at rest that WAKES UP — warms on hover, strengthens on focus (the
   * same step the tile takes on focus-within) — while the wash stays
   * quiet. The focus ring remains the a11y signal on top. */
  controlSurface: cn(
    "bg-stone-200/25 focus:bg-stone-200/40 enabled:hover:bg-stone-200/60 enabled:active:bg-stone-200/25 disabled:bg-stone-200/10",
    "border-stone-300/80 focus:border-stone-500/80 enabled:hover:border-stone-400/80",
    "placeholder:text-stone-600 disabled:border-stone-300/50 disabled:text-stone-600",
    "dark:bg-stone-800/25 dark:focus:bg-stone-800/40 dark:enabled:hover:bg-stone-800/60 dark:enabled:active:bg-stone-800/25 dark:disabled:bg-stone-800/10",
    "dark:border-stone-700 dark:focus:border-stone-500 dark:enabled:hover:border-stone-600",
    "dark:placeholder:text-stone-400 dark:disabled:border-stone-700/50 dark:disabled:text-stone-400",
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
    /** The prev/next navigation buttons framing the header dropdowns. */
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
    /** Every selectable cell: days, months, and week rows share this.
     * aria-disabled styling mirrors disabled: isDateDisabled days stay
     * FOCUSABLE (the APG pattern — discoverable, selection refused) but
     * must read as blocked. */
    cell: cn(
      "cursor-pointer rounded text-center text-sm",
      "enabled:not-aria-disabled:hover:bg-stone-200 dark:enabled:not-aria-disabled:hover:bg-stone-800",
      "disabled:cursor-not-allowed disabled:opacity-40",
      "aria-disabled:cursor-not-allowed aria-disabled:opacity-40",
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

  /** In-tile hairline separators — the quiet structure inside a pane. */
  divider: {
    /** The line itself (used for both plain and labeled forms). */
    line: "bg-stone-300/70 dark:bg-stone-800",
    /** The labeled form's text. */
    label: "text-xs whitespace-nowrap text-stone-500",
  },

  /** Status chips. Tone backgrounds stay muted — the TEXT carries the
   * meaning (color is never the only signal). */
  badge: {
    base: cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
      "text-xs font-medium whitespace-nowrap",
    ),
    tones: {
      neutral:
        "bg-stone-200/70 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
      positive:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
      warning:
        "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      critical: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
    },
  },

  /** Key-cap chip for keyboard hints — the tiling system is keyboard-
   * first, so UIs get to SAY so legibly. */
  kbd: cn(
    "rounded border px-1 font-mono text-[11px]",
    "border-stone-300 bg-stone-100 text-stone-600 shadow-[inset_0_-1px_0] shadow-stone-300",
    "dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:shadow-stone-700",
  ),

  /** Loading placeholder blocks — Spinner's quieter sibling for
   * pane-shaped waits. motion-reduce turns the pulse off. */
  skeleton: cn(
    "animate-pulse rounded bg-stone-200 motion-reduce:animate-none",
    "dark:bg-stone-800",
  ),

  /** The tiling system: the page is a CANVAS a shade removed from the
   * tile surface; tiles sit on it with tight gutters, and the canvas
   * showing through the gaps is what reads as panes. Two deliberately
   * quiet states: hover warms a tile's border a half-step; focus-within
   * marks the tile that owns the keyboard as the section you are IN —
   * one tile at a time, page-wide. */
  tiles: {
    /** The surface tiles sit on — visible only through the gutters. */
    canvas: "bg-stone-200/70 dark:bg-stone-950",
    /** Every tile: a soft-cornered surface with a hairline border. The
     * states modulate the BORDER only — background stays put, so content
     * never shifts appearance. */
    tile: cn(
      "rounded-lg border",
      "border-stone-300/70 bg-stone-50 text-stone-800",
      "dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200",
    ),
    /** Hover and focus-within share ONE half-step border warm-up —
     * enough for the pointer to feel the pane boundaries and for the
     * keyboard's pane to stay marked, never enough to draw the eye
     * from content (a stronger focus step read as jarring). Equal
     * values also mean hover-vs-focus precedence can't matter. */
    tileInteractive: cn(
      "transition-colors duration-200",
      "hover:border-stone-400/70 dark:hover:border-stone-700",
      "focus-within:border-stone-400/70 dark:focus-within:border-stone-700",
    ),
    /** The default content inset. */
    tilePadding: "p-1.5",

    /** A TileSplit's gutter — canvas showing through, widened hit area
     * inside, focusable for keyboard resizing. */
    /** Flex-centered: margin-auto only centers on the inline axis, so
     * the vertical-split handle sat pressed against the pane above. */
    separator: cn(
      "group relative flex touch-none items-center justify-center rounded select-none",
      focusRing,
    ),
    /** The gutter's handle line — invisible until hover/focus finds it,
     * solid while dragging (the component adds that state). */
    separatorHandle: cn(
      "rounded-full opacity-0 transition-opacity duration-150",
      "bg-stone-400 dark:bg-stone-600",
      "group-hover:opacity-100 group-focus-visible:opacity-100",
    ),

    /** TileTitle: the pane-title row and its parts. */
    title: "mb-3 flex items-center gap-2",
    titleText: "text-sm font-medium",
    titleActions: "ml-auto flex items-center gap-1",
  },

  modal: {
    /** The <dialog> element: centered by the UA, panel chrome ours. p-0 is
     * load-bearing — padding lives on `inner`, so backdrop clicks (which
     * target the dialog itself) are distinguishable from content clicks. */
    panel: cn(
      "m-auto w-full max-w-md rounded border p-0 shadow-xl",
      "border-stone-400 bg-stone-50 text-stone-800",
      "dark:border-stone-600 dark:bg-stone-950 dark:text-stone-200",
      "backdrop:bg-stone-950/40 backdrop:backdrop-blur-[2px]",
    ),
    /** The padded content wrapper inside the dialog. */
    inner: "flex flex-col gap-3 p-4",
    /** The dialog heading. */
    title: "text-lg font-medium",
    /** The corner close button. */
    closeButton: cn(
      "cursor-pointer rounded p-1",
      "hover:bg-stone-200 dark:hover:bg-stone-800",
      focusRing,
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

  /** Buttons AND Links share these (Link mirrors Button variant for
   * variant). The state language matches the tiles: borders and washes
   * wake up on interaction, nothing shifts layout. Interaction states
   * are gated with `not-disabled:` on purpose — `:enabled` only ever
   * matches form controls, so `enabled:`-gated hovers are DEAD on the
   * `<a>` side of this family; `:not(:disabled)` matches both. */
  button: {
    /** Chrome shared by all variants — sizing, radius, cursor, and the
     * tiles' transition timing. */
    base: cn(
      "inline-flex cursor-pointer items-center justify-center gap-1.5",
      "rounded-md px-3 py-1.5 transition-colors duration-150",
      "disabled:cursor-not-allowed",
      focusRing,
    ),
    /** Filled high-contrast variant — the one loud thing on a quiet
     * page, so a form's single primary action is findable at a glance. */
    primary: cn(
      "bg-stone-800 text-stone-50 not-disabled:hover:bg-stone-700 not-disabled:active:bg-stone-900",
      "disabled:bg-stone-800/50",
      "dark:bg-stone-200 dark:text-stone-900 dark:not-disabled:hover:bg-stone-300 dark:not-disabled:active:bg-stone-100",
      "dark:disabled:bg-stone-200/50",
    ),
    /** A tile in miniature: hairline border on a bare surface; hovering
     * warms the border and lifts the wash — the tile hover language. */
    secondary: cn(
      "border border-stone-300/80 bg-transparent text-inherit",
      "not-disabled:hover:border-stone-400/80 not-disabled:hover:bg-stone-200/40",
      "not-disabled:active:bg-stone-200/70",
      "disabled:border-stone-300/50 disabled:text-stone-500",
      "dark:border-stone-700 dark:not-disabled:hover:border-stone-600 dark:not-disabled:hover:bg-stone-800/60",
      "dark:not-disabled:active:bg-stone-800",
      "dark:disabled:border-stone-700/50 dark:disabled:text-stone-500",
    ),
    /** Blends into the surface until the pointer finds it — nav items,
     * toolbars, repeated row actions. */
    ghost: cn(
      "bg-transparent text-inherit",
      "not-disabled:hover:bg-stone-200/70 not-disabled:active:bg-stone-300/60",
      "disabled:text-stone-500",
      "dark:not-disabled:hover:bg-stone-800 dark:not-disabled:active:bg-stone-800/70",
      "dark:disabled:text-stone-500",
    ),
    /** Reads as text: underlined, tight padding, a gentle wash on hover
     * — the Link default, and fine for inline button actions too. */
    text: cn(
      "rounded px-1 py-0.5 text-inherit",
      "underline decoration-stone-400 underline-offset-3",
      "not-disabled:hover:bg-stone-200/60 not-disabled:hover:decoration-current",
      "disabled:text-stone-500 disabled:decoration-stone-300",
      "dark:decoration-stone-500 dark:not-disabled:hover:bg-stone-800/70",
      "dark:disabled:decoration-stone-700",
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
