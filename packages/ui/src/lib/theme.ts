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
const coreTheme = {
  /** Shared box chrome for input, textarea, and select. */
  controlBase: "w-full appearance-none rounded border px-2",
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
  select: "peer cursor-pointer pr-8 disabled:cursor-not-allowed",
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
    ),
    /** The clickable label text next to the box. */
    label: "cursor-pointer text-stone-600 dark:text-stone-400",
  },

  button: {
    /** Chrome shared by both variants — sizing, radius, cursor. */
    base: "cursor-pointer rounded px-3 py-1.5 disabled:cursor-not-allowed",
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
